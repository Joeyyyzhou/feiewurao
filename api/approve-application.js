// POST /api/approve-application
// body: { applicationId: string }
// 仅 admin 调用：审批通过 + 生成邀请码 + 发邮件
import { createClient } from '@supabase/supabase-js';
import { getTransporter, inviteCodeMail } from './_mail.js';
import { applyCors } from './_cors.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method not allowed' });
      return;
    }

    const adminPassword = req.headers['x-admin-password'];
    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const { applicationId } = req.body || {};
    if (!applicationId) {
      res.status(400).json({ error: 'missing applicationId' });
      return;
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      res.status(500).json({ error: '服务端缺少 SUPABASE_URL / SUPABASE_SERVICE_KEY 环境变量' });
      return;
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { auth: { persistSession: false } }
    );

    // 调 RPC 审批
    const { data, error } = await supabase.rpc('admin_approve_application', { p_id: applicationId });
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.email || !row?.code) {
      res.status(500).json({ error: 'RPC 返回数据异常' });
      return;
    }

    // 发邮件（失败不影响审批本身，返回 mail_sent=false 让前端知道）
    let mailSent = true;
    let mailError = null;
    try {
      await getTransporter().sendMail(inviteCodeMail(row.email, row.code));
    } catch (err) {
      mailSent = false;
      mailError = err?.message || String(err);
      console.error('[approve-application] sendMail failed:', mailError);
    }

    res.status(200).json({ ok: true, email: row.email, code: row.code, mail_sent: mailSent, mail_error: mailError });
  } catch (e) {
    // 全局兜底：任何异常都返回带 CORS 头的 JSON，避免浏览器 Failed to fetch
    console.error('[approve-application] fatal:', e?.stack || e);
    res.status(500).json({ error: '服务端异常：' + (e?.message || String(e)) });
  }
}
