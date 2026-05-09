// Supabase Edge Function · sensitive-check
// 在扔瓶 API 前调用，前端调 supabase.functions.invoke('sensitive-check', { body: { content } })
// 接力 automation 部署：supabase functions deploy sensitive-check

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const SENSITIVE_WORDS = [
  // 辱骂
  '傻逼', '操你', '滚蛋', 'sb', 'nmsl', '草泥马',
  // 引流
  '微信号', '加我vx', '加微信', '加qq', '加好友', '私聊', '私信我',
  // 政治敏感（保守起步，明天再补完整词库）
  '六四', '法轮', '邪教', '反动',
  // 色情
  '色情', '约炮', 'av', '裸聊',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    const { content } = await req.json();
    if (!content || typeof content !== 'string') {
      return json({ error: 'invalid input' }, 400);
    }
    const lower = content.toLowerCase().replace(/\s/g, '');
    const hit = SENSITIVE_WORDS.find((w) => lower.includes(w.toLowerCase()));
    if (hit) {
      return json({ sensitive: true, hit });
    }
    return json({ sensitive: false });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
