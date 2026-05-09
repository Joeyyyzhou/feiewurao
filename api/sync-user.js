import { createClient } from '@supabase/supabase-js';

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
    const createdDate = user.created_at.split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const created = new Date(createdDate + 'T00:00:00');
    const now = new Date(today + 'T00:00:00');
    const dayCount = Math.max(1, Math.floor((now.getTime() - created.getTime()) / 86400000) + 1);

    const { data: todayAnswers } = await supabase
      .from('answers')
      .select('id')
      .eq('user_id', user.id)
      .eq('answered_date', today);

    // 获取用户所有已回答的题目ID
    const { data: allAnswers } = await supabase
      .from('answers')
      .select('question_id')
      .eq('user_id', user.id);

    const answeredQuestionIds = (allAnswers || []).map(a => a.question_id);

    return res.status(200).json({
      success: true,
      userId: user.id,
      dayCount,
      createdAt: user.created_at,
      todayAnswerCount: todayAnswers?.length || 0,
      answeredQuestionIds,
    });
  } catch (err) {
    return res.status(200).json({ success: false, error: String(err.message || err) });
  }
}
