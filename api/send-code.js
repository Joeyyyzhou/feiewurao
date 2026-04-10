import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email || !email.endsWith('@tencent.com')) {
    return res.status(400).json({ error: '请输入 @tencent.com 邮箱' });
  }

  // Generate 6-digit code, expires in 10 minutes
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Delete old codes for this email, then insert new one
  await supabase.from('verification_codes').delete().eq('email', email);
  const { error: dbError } = await supabase.from('verification_codes').insert({
    email,
    code,
    expires_at: expiresAt,
  });

  if (dbError) {
    console.error('DB error:', dbError);
    return res.status(500).json({ error: '服务器错误，请稍后重试' });
  }

  // Send email via Resend
  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: '非鹅勿扰 <onboarding@resend.dev>',
        to: [email],
        subject: `你的验证码是 ${code}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <span style="font-size: 48px;">🐧💡</span>
            </div>
            <h1 style="color: #1C1440; font-size: 24px; font-weight: 700; text-align: center; margin-bottom: 8px;">
              非鹅勿扰
            </h1>
            <p style="color: #6E6494; font-size: 14px; text-align: center; margin-bottom: 32px;">
              不看脸，只听心
            </p>
            <div style="background: linear-gradient(135deg, #EDE7F6, #D0C8E4); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
              <p style="color: #6E6494; font-size: 14px; margin-bottom: 12px;">你的验证码是</p>
              <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1C1440; font-family: monospace;">
                ${code}
              </div>
              <p style="color: #A99DBF; font-size: 12px; margin-top: 12px;">10 分钟内有效</p>
            </div>
            <p style="color: #A99DBF; font-size: 12px; text-align: center;">
              如果你没有请求此验证码，请忽略这封邮件。
            </p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error('Resend error:', errBody);
      return res.status(500).json({ error: '邮件发送失败，请稍后重试' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Send error:', err);
    return res.status(500).json({ error: '邮件发送失败' });
  }
}
