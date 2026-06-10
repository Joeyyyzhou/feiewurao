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

/**
 * 调用 Supabase Edge Function 时带超时保护。
 * 用途：sensitive-check 等可选检查；超时/未部署都直接放过，由后端 RPC 兜底。
 * @returns 成功返回 invoke 结果；超时/异常返回 { data: null, error: Error }
 */
export async function invokeWithTimeout(
  name: string,
  body: any,
  timeoutMs = 2500
): Promise<{ data: any; error: any }> {
  try {
    const invokePromise = supabase.functions.invoke(name, { body });
    const timeoutPromise = new Promise((_, rej) =>
      setTimeout(() => rej(new Error(`${name} timeout`)), timeoutMs)
    );
    return await Promise.race([invokePromise, timeoutPromise]) as any;
  } catch (e) {
    return { data: null, error: e };
  }
}
