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
    // 1. Find user by email
    const { data: users } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).limit(1);
    if (!users || users.length === 0) return res.status(200).json({ success: false, error: 'user not found' });
    const me = users[0];

    // 2. Get my answered question IDs
    const { data: myAnswers } = await supabase.from('answers').select('question_id').eq('user_id', me.id);
    const myAnsweredIds = new Set((myAnswers || []).map(a => a.question_id));
    if (myAnsweredIds.size === 0) return res.status(200).json({ success: true, guests: [], debug: 'no answers' });

    // 3. Get candidates (opposite gender, not me)
    const { data: candidates } = await supabase
      .from('users').select('*')
      .neq('id', me.id)
      .eq('gender', me.pref_gender)
      .limit(100);
    if (!candidates || candidates.length === 0) return res.status(200).json({ success: true, guests: [], debug: 'no candidates' });

    // 4. Get all candidate answers
    const candidateIds = candidates.map(c => c.id);
    const { data: allAnswers } = await supabase
      .from('answers').select('user_id, question_id, content')
      .in('user_id', candidateIds);

    // 5. Build answer map
    const candidateAnswerMap = new Map();
    (allAnswers || []).forEach(a => {
      if (!candidateAnswerMap.has(a.user_id)) candidateAnswerMap.set(a.user_id, []);
      candidateAnswerMap.get(a.user_id).push({ question_id: a.question_id, content: a.content });
    });

    // 6. Exclude already-lit and blocked
    const { data: sentLights } = await supabase
      .from('light_notifications').select('to_user_id').eq('from_user_id', me.id);
    const confirmedIds = new Set((sentLights || []).map(r => r.to_user_id));

    // 7. Filter & sort
    const eligible = candidates
      .filter(c => {
        if (confirmedIds.has(c.id)) return false;
        const answers = candidateAnswerMap.get(c.id) || [];
        return answers.some(a => myAnsweredIds.has(a.question_id));
      })
      .map(c => {
        const answers = candidateAnswerMap.get(c.id) || [];
        const commonAnswers = answers.filter(a => myAnsweredIds.has(a.question_id));
        return { ...c, commonCount: commonAnswers.length, commonAnswers };
      })
      .sort((a, b) => {
        const cityA = a.base_city === me.base_city ? 1 : 0;
        const cityB = b.base_city === me.base_city ? 1 : 0;
        if (cityB !== cityA) return cityB - cityA;
        return b.commonCount - a.commonCount;
      })
      .slice(0, 5);

    // 8. Build guest cards
    const guests = eligible.map(c => ({
      id: c.id,
      nickname: c.nickname,
      avatarColor: c.avatar_color,
      answers: c.commonAnswers.slice(0, 4).map(a => ({
        questionId: a.question_id,
        content: a.content,
      })),
      lightStatus: 'on',
    }));

    return res.status(200).json({ success: true, guests });
  } catch (err) {
    return res.status(500).json({ success: false, error: String(err.message || err) });
  }
}
