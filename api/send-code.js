import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const AK_ID = process.env.ALIYUN_AK_ID;
const AK_SECRET = process.env.ALIYUN_AK_SECRET;

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function percentEncode(str) {
  return encodeURIComponent(str)
    .replace(/\+/g, '%20')
    .replace(/\*/g, '%2A')
    .replace(/~/g, '%7E');
}

function signRequest(params) {
  const sorted = Object.keys(params).sort()
    .map(k => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join('&');
  const stringToSign = `POST&${percentEncode('/')}&${percentEncode(sorted)}`;
  const hmac = crypto.createHmac('sha1', AK_SECRET + '&');
  hmac.update(stringToSign);
  return hmac.digest('base64');
}

async function sendEmail(to, subject, code) {
  const html = `<div style="max-width:400px;margin:0 auto;padding:30px;font-family:sans-serif;text-align:center"><div style="font-size:40px;margin-bottom:20px">🐧💡</div><h2 style="color:#1C1440;margin-bottom:4px">非鹅勿扰</h2><p style="color:#6E6494;font-size:13px;margin-bottom:24px">不看脸，只听心</p><div style="background:#EDE7F6;border-radius:12px;padding:24px;margin-bottom:20px"><p style="color:#6E6494;font-size:13px;margin-bottom:8px">你的验证码是</p><div style="font-size:32px;font-weight:800;letter-spacing:6px;color:#1C1440;font-family:monospace">${code}</div><p style="color:#A99DBF;font-size:11px;margin-top:8px">10 分钟内有效</p></div><p style="color:#A99DBF;font-size:11px">如果你没有请求此验证码，请忽略这封邮件</p></div>`;

  const params = {
    Action: 'SingleSendMail',
    AccountName: 'noreply@feiewurao.cn',
    AddressType: '1',
    ReplyToAddress: 'false',
    ToAddress: to,
    Subject: subject,
    HtmlBody: html,
    Format: 'JSON',
    Version: '2015-11-23',
    AccessKeyId: AK_ID,
    SignatureMethod: 'HMAC-SHA1',
    SignatureVersion: '1.0',
    SignatureNonce: crypto.randomUUID(),
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    RegionId: 'cn-hangzhou',
    FromAlias: '非鹅勿扰',
  };

  params.Signature = signRequest(params);

  const body = Object.keys(params)
    .map(k => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join('&');

  const res = await fetch('https://dm.aliyuncs.com/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await res.json();
  if (data.Code) {
    throw new Error(data.Message || data.Code);
  }
  return data;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email || !email.endsWith('@tencent.com')) {
    return res.status(400).json({ error: '请输入 @tencent.com 邮箱' });
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabase.from('verification_codes').delete().eq('email', email);
  const { error: dbError } = await supabase.from('verification_codes').insert({
    email, code, expires_at: expiresAt,
  });

  if (dbError) {
    return res.status(500).json({ error: '服务器错误' });
  }

  try {
    await sendEmail(email, `验证码 ${code} - 非鹅勿扰`, code);
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
}
