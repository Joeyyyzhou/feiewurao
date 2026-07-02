// POST /api/reset-password
// body: { email, code, newPassword }
// 公开 endpoint：用验证码 + 新密码重置
import { createClient } from '@supabase/supabase-js';
import { applyCors } from './_cors.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  const { email, code, newPassword } = req.body || {};
  if (!email || !code || !newPassword) {
    res.status(400).json({ error: '邮箱、验证码、新密码都必填' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: '新密码至少 6 位' });
    return;
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase.rpc('reset_password_with_code', {
    p_email: email,
    p_code: code,
    p_new_password: newPassword,
  });
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(200).json({ ok: true });
}
