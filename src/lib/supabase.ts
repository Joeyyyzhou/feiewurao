/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anon) {
  console.warn('[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 未配置');
}

// 用 any 客户端（demo 阶段务实取舍：让 RPC 名和动态 from() 都通过类型检查）。
// 上线后用 `supabase gen types typescript --project-id xarpwuvsbmytbbauktlm > database.types.ts` 替换。
export const supabase: any = createClient(url, anon, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
