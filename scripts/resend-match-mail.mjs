// 一次性脚本：补发虾饺-leo 这次匹配的邮件（双方都发）
import { createClient } from '@supabase/supabase-js';
import { sendNotifyMail } from '../api/mail-utils.js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function main() {
  // 查 leo 和 虾饺
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, nickname')
    .in('nickname', ['leo', '虾饺']);
  if (error) throw error;
  console.log('找到用户：', users.map(u => `${u.nickname}(${u.email})`).join(', '));

  const leo = users.find(u => u.nickname === 'leo');
  const xj = users.find(u => u.nickname === '虾饺');
  if (!leo || !xj) {
    console.error('找不到 leo 或 虾饺，请检查昵称是否准确');
    process.exit(1);
  }

  // 验证两人确实在 matches 表中匹配（分两次查避免 or() 语法陷阱）
  const { data: m1 } = await supabase
    .from('matches')
    .select('id, user1_id, user2_id, created_at')
    .eq('user1_id', leo.id)
    .eq('user2_id', xj.id);
  const { data: m2 } = await supabase
    .from('matches')
    .select('id, user1_id, user2_id, created_at')
    .eq('user1_id', xj.id)
    .eq('user2_id', leo.id);
  const matches = [...(m1 || []), ...(m2 || [])];
  console.log('匹配记录数：', matches.length);
  if (matches[0]) console.log('  时间：', matches[0].created_at);

  if (matches.length === 0) {
    console.error('两人未匹配，跳过');
    process.exit(1);
  }

  // 双方都发匹配邮件
  console.log(`补发邮件给 leo (${leo.email})...`);
  const r1 = await sendNotifyMail(leo.email, 'match', xj.nickname);
  console.log(`  leo:`, r1 ? '成功' : '失败');

  console.log(`补发邮件给 虾饺 (${xj.email})...`);
  const r2 = await sendNotifyMail(xj.email, 'match', leo.nickname);
  console.log(`  虾饺:`, r2 ? '成功' : '失败');
}

main().catch(err => {
  console.error('补发失败：', err);
  process.exit(1);
});
