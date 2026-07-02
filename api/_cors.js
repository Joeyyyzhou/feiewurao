// _cors.js —— 统一 CORS 处理
// 管理后台(feiewuraoadmin.asia)与主站(feiewurao.cn)跨域调用 /api/* 时需要。
// 用法：在 handler 最前面 `if (applyCors(req, res)) return;`
//  - 命中 OPTIONS 预检：直接 204 返回，返回 true（调用方 return）
//  - 其它请求：写上 CORS 头，返回 false（继续走业务逻辑）

const ALLOWED_ORIGINS = [
  'https://feiewurao.cn',
  'https://www.feiewurao.cn',
  'https://feiewuraoadmin.asia',
  'https://www.feiewuraoadmin.asia',
  'https://feiewurao.vercel.app',
  'https://feiewurao-admin.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

export function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // 兜底：允许主站（避免未知来源完全无响应头）
    res.setHeader('Access-Control-Allow-Origin', 'https://feiewurao.cn');
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
