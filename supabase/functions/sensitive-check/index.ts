// Supabase Edge Function · sensitive-check
// 用 sensitive-word-tool（DFA 算法）+ 默认 4 大类敏感词库 + 自定义补丁
// 部署：cd feiewurao-app && supabase functions deploy sensitive-check --no-verify-jwt
//
// 调用：supabase.functions.invoke('sensitive-check', { body: { content: '...' } })
// 返回：{ sensitive: boolean, hit?: string[] }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-ignore - Deno 通过 npm: 前缀直接引用 npm 包
import SensitiveWordTool from 'npm:sensitive-word-tool@1.1.10';

// 自定义补丁词：覆盖联系方式、内部账号等业务相关
const CUSTOM_WORDS = [
  // 联系方式
  '加微信', '加vx', '加v', '加wx', '加qq', '加扣扣', '加企微',
  '我的微信', '我微信', '私聊微信', '加好友', '加我好友',
  '微信号', '微信：', '微信:',
  'vx：', 'vx:', 'wx：', 'wx:',
  'qq号', '扣扣号', '企业微信号', '企微号',
  '手机号', '我的手机', 'telegram', 'tg：', 'tg:',
  // 内部敏感（漂流瓶产品定位是匿名）
  '我是谁谁谁', '本人姓名', 'leader 是',
];

// 初始化一次，常驻内存（Deno Edge Function 同实例复用）
const tool = new SensitiveWordTool({
  useDefaultWords: true,    // 启用 4 大类默认词库（广告/政治/色情/暴力）
  wordList: CUSTOM_WORDS,   // 业务自定义补丁
});

// 手机号、QQ 号正则（DFA 没法做正则，单独跑）
const PHONE_RE = /(?<![0-9])1[3-9][0-9]{9}(?![0-9])/;
const QQ_RE = /(qq|扣扣|企鹅|加我)[^\d]{0,8}[0-9]{5,12}/i;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  try {
    const { content } = await req.json();
    if (!content || typeof content !== 'string') {
      return json({ error: 'invalid input' }, 400);
    }

    // 1) DFA 匹配（默认词库 + 自定义）
    const matched: string[] = tool.match(content);
    if (matched && matched.length > 0) {
      return json({ sensitive: true, hit: matched, kind: 'keyword' });
    }

    // 2) 手机号正则
    if (PHONE_RE.test(content)) {
      return json({ sensitive: true, hit: ['手机号'], kind: 'phone' });
    }

    // 3) QQ 号正则
    if (QQ_RE.test(content)) {
      return json({ sensitive: true, hit: ['QQ号'], kind: 'qq' });
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
      ...CORS,
    },
  });
}
