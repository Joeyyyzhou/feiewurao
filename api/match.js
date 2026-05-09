import { createClient } from '@supabase/supabase-js';
import { decrypt } from './crypto-utils.js';
import { sendNotifyMail } from './mail-utils.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// 取用户邮箱+昵称（合并一次查询）
async function getUserMeta(userId) {
  const { data } = await supabase.from('users').select('email, nickname').eq('id', userId).single();
  return data || { email: null, nickname: null };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, fromUserId, toUserId, notificationId } = req.body;

  try {
    if (action === 'finalize') {
      // 写入留灯记录
      await supabase.from('light_notifications').insert({ from_user_id: fromUserId, to_user_id: toUserId });

      // 检查对方是否也对自己留过灯（双向匹配）
      const { data: mutual } = await supabase
        .from('light_notifications')
        .select('id')
        .eq('from_user_id', toUserId)
        .eq('to_user_id', fromUserId)
        .eq('status', 'pending')
        .limit(1);

      if (mutual && mutual.length > 0) {
        // 双向匹配
        await supabase.from('matches').insert({ user1_id: fromUserId, user2_id: toUserId });
        await supabase.from('light_notifications').update({ status: 'matched' }).eq('from_user_id', toUserId).eq('to_user_id', fromUserId);
        await supabase.from('light_notifications').update({ status: 'matched' }).eq('from_user_id', fromUserId).eq('to_user_id', toUserId);

        // 解密对方微信号给当前发起者
        const { data: matchedUser } = await supabase.from('users').select('wechat_id').eq('id', toUserId).single();
        const wechatId = matchedUser ? decrypt(matchedUser.wechat_id) : '';

        // 邮件：双方都发"匹配成功"
        const [a, b] = await Promise.all([getUserMeta(fromUserId), getUserMeta(toUserId)]);
        await Promise.all([
          a.email ? sendNotifyMail(a.email, 'match', b.nickname) : null,
          b.email ? sendNotifyMail(b.email, 'match', a.nickname) : null,
        ]);

        return res.status(200).json({ success: true, matched: true, wechatId });
      }

      // 单边留灯：邮件通知被留灯方
      const [from, to] = await Promise.all([getUserMeta(fromUserId), getUserMeta(toUserId)]);
      if (to.email) await sendNotifyMail(to.email, 'light', from.nickname);

      return res.status(200).json({ success: true, matched: false });
    }

    if (action === 'respond') {
      const accept = req.body.accept;
      if (accept) {
        await supabase.from('light_notifications').update({ status: 'matched' }).eq('id', notificationId);
        await supabase.from('matches').insert({ user1_id: fromUserId, user2_id: toUserId });

        // 解密对方（最初留灯者）微信号给当前响应者
        const { data: matchedUser } = await supabase.from('users').select('wechat_id').eq('id', fromUserId).single();
        const wechatId = matchedUser ? decrypt(matchedUser.wechat_id) : '';

        // 邮件：双方都发"匹配成功"
        const [a, b] = await Promise.all([getUserMeta(fromUserId), getUserMeta(toUserId)]);
        await Promise.all([
          a.email ? sendNotifyMail(a.email, 'match', b.nickname) : null,
          b.email ? sendNotifyMail(b.email, 'match', a.nickname) : null,
        ]);

        return res.status(200).json({ success: true, matched: true, wechatId });
      } else {
        await supabase.from('light_notifications').update({ status: 'ignored' }).eq('id', notificationId);
        return res.status(200).json({ success: true, matched: false });
      }
    }

    // Get decrypted wechat for a matched user (for profile page)
    if (action === 'get-match-wechat') {
      const { matchedUserId } = req.body;
      const { data: user } = await supabase.from('users').select('wechat_id').eq('id', matchedUserId).single();
      const wechatId = user ? decrypt(user.wechat_id) : '';
      return res.status(200).json({ success: true, wechatId });
    }

    return res.status(400).json({ error: 'invalid action' });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
}
