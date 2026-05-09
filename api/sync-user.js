import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

function calcStreak(answeredDates, todayStr) {
  if (!answeredDates || answeredDates.size === 0) return 0;
  const today = new Date(todayStr + 'T00:00:00');
  let cursor = new Date(today);
  let streak = 0;
  const answeredToday = answeredDates.has(todayStr);
  if (!answeredToday) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (true) {
    const key = cursor.toISOString().split('T')[0];
    if (answeredDates.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });

  try {
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, created_at')
      .eq('email', email.toLowerCase())
      .limit(1);

    if (userError || !users || users.length === 0) {
      return res.status(200).json({ success: false, error: userError?.message || 'not found' });
    }

    const user = users[0];
    const today = new Date().toISOString().split('T')[0];

    const { data: todayAnswers } = await supabase
      .from('answers')
      .select('id')
      .eq('user_id', user.id)
      .eq('answered_date', today);

    // 获取用户所有已回答的题目（含 date 用于算 dayCount）
    const { data: allAnswers } = await supabase
      .from('answers')
      .select('question_id, answered_date')
      .eq('user_id', user.id);

    const answeredQuestionIds = (allAnswers || []).map(a => a.question_id);

    // === dayCount = 用户实际答过题的独立日期数量 ===
    const answeredDates = new Set(
      (allAnswers || []).filter(a => a.answered_date).map(a => a.answered_date)
    );
    const pastActiveDays = answeredDates.size;
    const answeredToday = answeredDates.has(today);
    const dayCount = Math.max(1, answeredToday ? pastActiveDays : pastActiveDays + 1);
    const streak = calcStreak(answeredDates, today);

    return res.status(200).json({
      success: true,
      userId: user.id,
      dayCount,
      streak,
      createdAt: user.created_at,
      todayAnswerCount: todayAnswers?.length || 0,
      answeredQuestionIds,
    });
  } catch (err) {
    return res.status(200).json({ success: false, error: String(err.message || err) });
  }
}
