// POST /api/send-register-code
// body: { email: string }
// 公开 endpoint：注册前生成验证码 + 发邮件
import { createClient } from '@supabase/supabase-js';
import { getTransporter, registerCodeMail } from './_mail.js';
import { applyCors } from './_cors.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method not allowed' });
      return;
    }
    const { email } = req.body || {};
    if (!email) {
      res.status(400).json({ error: '请输入邮箱' });
      return;
    }
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      res.status(500).json({ error: '服务端缺少 SUPABASE 配置' });
      return;
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabase.rpc('request_register_code', { p_email: email });
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    const code = row?.plain_code;
    if (!code) {
      res.status(500).json({ error: 'RPC 返回数据异常' });
      return;
    }

    try {
      await getTransporter().sendMail(registerCodeMail(email, code));
    } catch (err) {
      console.error('[send-register-code] sendMail failed:', err?.message || err);
      res.status(500).json({ error: '验证码邮件发送失败，请稍后重试' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[send-register-code] fatal:', e?.stack || e);
    res.status(500).json({ error: '服务端异常：' + (e?.message || String(e)) });
  }
}
