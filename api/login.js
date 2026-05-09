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

    // Get all answers (needed both for response & dayCount calc)
    const { data: answers } = await supabase
      .from('answers')
      .select('question_id, content, answered_date')
      .eq('user_id', u.id)
      .order('created_at', { ascending: true });

    // === dayCount = 用户实际答过题的独立日期数量 ===
    // 如果用户中间很多天没登录/没答题，那些天不算
    // 如果今天还没答题，当前就是"第 N+1 天"（N 为过去已答题的天数）
    const today = new Date().toISOString().split('T')[0];
    const answeredDates = new Set(
      (answers || [])
        .filter(a => a.answered_date)
        .map(a => a.answered_date)
    );
    const pastActiveDays = answeredDates.size;
    // 今天还没答题，则今天是新一天（第 pastActiveDays + 1 天）
    // 今天已经答过题，则今天就是第 pastActiveDays 天
    const answeredToday = answeredDates.has(today);
    const dayCount = Math.max(1, answeredToday ? pastActiveDays : pastActiveDays + 1);

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
