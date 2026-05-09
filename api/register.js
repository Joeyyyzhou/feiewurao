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

  const { email, nickname, gender, base_city, wechat_id, avatar_color, pref_gender, pref_base_cities } = req.body;
  if (!email || !nickname || !gender || !base_city || !wechat_id || !avatar_color || !pref_gender) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    // Encrypt wechat_id before storing
    const encryptedWechatId = encrypt(wechat_id);

    const { data, error } = await supabase.from('users').insert({
      email,
      nickname,
      gender,
      base_city,
      wechat_id: encryptedWechatId,
      avatar_color,
      pref_gender,
      pref_base_cities: pref_base_cities || [],
    }).select('id, order_num').single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, id: data.id, orderNum: data.order_num });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
}
