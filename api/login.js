import { createClient } from '@supabase/supabase-js';
import { decrypt, mask } from './crypto-utils.js';

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

  const { nickname, password } = req.body;
  if (!nickname || !password) {
    return res.status(200).json({ success: false, error: '请输入昵称和密码' });
  }

  try {
    // Find user by nickname
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('nickname', nickname.trim())
      .limit(1);

    if (error) return res.status(500).json({ success: false, error: error.message });
    if (!users || users.length === 0) {
      return res.status(200).json({ success: false, error: '昵称或密码错误' });
    }

    const u = users[0];

    // Password check: if database has password field and it's set, verify it
    // Otherwise accept any password (legacy users without DB password)
    if (u.password && u.password !== '' && u.password !== password) {
      return res.status(200).json({ success: false, error: '昵称或密码错误' });
    }

    // Calculate correct dayCount
    const createdDate = u.created_at.split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const created = new Date(createdDate + 'T00:00:00');
    const now = new Date(today + 'T00:00:00');
    const dayCount = Math.max(1, Math.floor((now.getTime() - created.getTime()) / 86400000) + 1);

    // Get all answers
    const { data: answers } = await supabase
      .from('answers')
      .select('question_id, content, answered_date')
      .eq('user_id', u.id)
      .order('created_at', { ascending: true });

    return res.status(200).json({
      success: true,
      user: {
        id: u.id,
        email: u.email,
        nickname: u.nickname,
        password: password, // echo back the password so frontend can store it
        gender: u.gender,
        baseCity: u.base_city,
        wechatId: decrypt(u.wechat_id),
        avatarColor: u.avatar_color,
        prefGender: u.pref_gender,
        prefBaseCities: u.pref_base_cities || [],
        createdAt: u.created_at,
        dayCount,
        orderNum: u.order_num,
      },
      answers: (answers || []).map(a => ({
        questionId: a.question_id,
        content: a.content,
        answeredDate: a.answered_date,
      })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: String(err.message || err) });
  }
}
