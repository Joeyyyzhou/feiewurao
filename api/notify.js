import { sendNotifyMail } from './mail-utils.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { toEmail, type, fromNickname } = req.body;
  if (!toEmail || !type) {
    return res.status(400).json({ error: 'Missing toEmail or type' });
  }
  if (type !== 'light' && type !== 'match') {
    return res.status(400).json({ error: 'Invalid type' });
  }

  const ok = await sendNotifyMail(toEmail, type, fromNickname);
  if (ok) return res.status(200).json({ success: true });
  return res.status(500).json({ error: 'send failed' });
}
