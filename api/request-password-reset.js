// POST /api/request-password-reset
// body: { email: string }
// 公开 endpoint：生成验证码 + 发邮件
import { createClient } from '@supabase/supabase-js';
import { getTransporter, passwordResetMail } from './_mail.js';
import { applyCors } from './_cors.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  const { email } = req.body || {};
  if (!email) {
    res.status(400).json({ error: '请输入邮箱' });
    return;
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  );

  // 调 RPC 生成验证码
  const { data, error } = await supabase.rpc('request_password_reset', { p_email: email });
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

  // 发邮件
  try {
    await getTransporter().sendMail(passwordResetMail(email, code));
  } catch (err) {
    console.error('[request-password-reset] sendMail failed:', err.message);
    res.status(500).json({ error: '发送邮件失败，请稍后重试' });
    return;
  }

  res.status(200).json({ ok: true });
}
