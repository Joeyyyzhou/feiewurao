import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: '缺少参数' });
  }

  // Look up the code
  const { data, error } = await supabase
    .from('verification_codes')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('code', code)
    .single();

  if (error || !data) {
    return res.status(400).json({ success: false, error: '验证码错误' });
  }

  // Check expiry
  if (new Date(data.expires_at) < new Date()) {
    // Clean up expired code
    await supabase.from('verification_codes').delete().eq('id', data.id);
    return res.status(400).json({ success: false, error: '验证码已过期，请重新发送' });
  }

  // Code is valid — delete it (one-time use)
  await supabase.from('verification_codes').delete().eq('id', data.id);

  return res.status(200).json({ success: true });
}
