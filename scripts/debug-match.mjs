// 调查脚本：查 leo 和 虾饺 的留灯+匹配状态
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const { data: users } = await supabase.from('users').select('id, email, nickname').in('nickname', ['leo', '虾饺']);
console.log('users:', users);
const leo = users.find(u => u.nickname === 'leo');
const xj = users.find(u => u.nickname === '虾饺');

const { data: lns } = await supabase
  .from('light_notifications')
  .select('id, from_user_id, to_user_id, status, created_at')
  .or(`from_user_id.eq.${leo.id},to_user_id.eq.${leo.id},from_user_id.eq.${xj.id},to_user_id.eq.${xj.id}`)
  .order('created_at');
console.log('\nlight_notifications 涉及两人的：');
for (const r of lns || []) {
  const from = r.from_user_id === leo.id ? 'leo' : (r.from_user_id === xj.id ? '虾饺' : r.from_user_id.slice(0,8));
  const to = r.to_user_id === leo.id ? 'leo' : (r.to_user_id === xj.id ? '虾饺' : r.to_user_id.slice(0,8));
  console.log(`  ${from} → ${to}  status=${r.status}  ${r.created_at}`);
}

const { data: ms } = await supabase.from('matches').select('id, user1_id, user2_id, created_at').order('created_at');
console.log('\nmatches 全部：');
for (const r of ms || []) {
  const tag1 = r.user1_id === leo.id ? 'leo' : (r.user1_id === xj.id ? '虾饺' : r.user1_id.slice(0,8));
  const tag2 = r.user2_id === leo.id ? 'leo' : (r.user2_id === xj.id ? '虾饺' : r.user2_id.slice(0,8));
  console.log(`  ${tag1} ↔ ${tag2}  ${r.created_at}`);
}
