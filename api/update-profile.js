import { createClient } from '@supabase/supabase-js';
import { encrypt } from './crypto-utils.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, nickname, baseCity, wechatId } = req.body || {};
  if (!userId) return res.status(400).json({ error: '缺少 userId' });

  const dbFields = {};
  if (typeof nickname === 'string' && nickname.trim()) dbFields.nickname = nickname.trim();
  if (typeof baseCity === 'string' && baseCity.trim()) dbFields.base_city = baseCity.trim();
  if (typeof wechatId === 'string' && wechatId.trim()) {
    // 加密后再写库
    dbFields.wechat_id = encrypt(wechatId.trim());
  }

  if (Object.keys(dbFields).length === 0) {
    return res.status(400).json({ error: '没有可更新的字段' });
  }

  try {
    const { error } = await supabase.from('users').update(dbFields).eq('id', userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
}
