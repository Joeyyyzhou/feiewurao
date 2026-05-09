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

  try {
    // Delete all answers
    const { error: e1 } = await supabase.from('answers').delete().neq('question_id', -1);
    // Delete all light_notifications
    const { error: e2 } = await supabase.from('light_notifications').delete().neq('from_user_id', '00000000-0000-0000-0000-000000000000');
    // Delete all matches
    const { error: e3 } = await supabase.from('matches').delete().neq('user1_id', '00000000-0000-0000-0000-000000000000');

    return res.status(200).json({
      success: true,
      errors: [e1?.message, e2?.message, e3?.message].filter(Boolean),
    });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
}
