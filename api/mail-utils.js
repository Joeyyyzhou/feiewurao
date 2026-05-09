import nodemailer from 'nodemailer';

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: 'smtpdm.aliyun.com',
    port: 80,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

function buildHtml(type, fromNickname) {
  if (type === 'light') {
    return {
      subject: '💡 有人对你留灯了 — 非鹅勿扰',
      html: `
        <div style="max-width:440px;margin:0 auto;padding:36px;font-family:-apple-system,'PingFang SC',sans-serif;text-align:center">
          <div style="font-size:48px;margin-bottom:16px">🐧💡</div>
          <h2 style="color:#1E1833;margin-bottom:6px;font-size:20px">有人对你留灯了</h2>
          <p style="color:#5C5480;font-size:14px;margin-bottom:28px">
            有一个人看了你的回答后，决定为你留下今天唯一的一盏灯。
          </p>
          <div style="background:#F5F3FA;border-radius:16px;padding:24px;margin-bottom:24px">
            <p style="color:#5C5480;font-size:13px;margin-bottom:4px">快来看看 TA 的回答</p>
            <p style="color:#9B93B5;font-size:12px">登录后在「留灯通知」中查看并决定是否回应</p>
          </div>
          <a href="https://feiewurao.cn" style="display:inline-block;background:#1E1833;color:#F0ECF8;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px">
            打开非鹅勿扰
          </a>
          <p style="color:#9B93B5;font-size:11px;margin-top:24px">留灯有效期 7 天，过期自动失效</p>
          <p style="color:#9B93B5;font-size:10px;margin-top:12px">非鹅勿扰 · 不看脸，只听心</p>
        </div>
      `,
    };
  }
  if (type === 'match') {
    return {
      subject: '💜 匹配成功！— 非鹅勿扰',
      html: `
        <div style="max-width:440px;margin:0 auto;padding:36px;font-family:-apple-system,'PingFang SC',sans-serif;text-align:center">
          <div style="font-size:48px;margin-bottom:16px">💜✨</div>
          <h2 style="color:#1E1833;margin-bottom:6px;font-size:20px">恭喜，你们匹配成功了！</h2>
          <p style="color:#5C5480;font-size:14px;margin-bottom:28px">
            你和${fromNickname ? ` <strong>${fromNickname}</strong> ` : '一位嘉宾'}互相留灯，现在可以看到对方的微信号了。
          </p>
          <div style="background:#F5F3FA;border-radius:16px;padding:24px;margin-bottom:24px">
            <p style="color:#5C5480;font-size:13px">登录后在「匹配」中查看微信号</p>
          </div>
          <a href="https://feiewurao.cn" style="display:inline-block;background:#1E1833;color:#F0ECF8;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px">
            打开非鹅勿扰
          </a>
          <p style="color:#9B93B5;font-size:10px;margin-top:24px">非鹅勿扰 · 不看脸，只听心</p>
        </div>
      `,
    };
  }
  return null;
}

/**
 * 发送通知邮件（不抛错；失败只 console.error）
 * @param {string} toEmail
 * @param {'light'|'match'} type
 * @param {string} [fromNickname]
 * @returns {Promise<boolean>} success
 */
export async function sendNotifyMail(toEmail, type, fromNickname) {
  if (!toEmail || !type) return false;
  const tpl = buildHtml(type, fromNickname);
  if (!tpl) return false;
  try {
    await getTransporter().sendMail({
      from: '"非鹅勿扰" <noreply@feiewurao.cn>',
      to: toEmail,
      subject: tpl.subject,
      html: tpl.html,
    });
    return true;
  } catch (err) {
    console.error('[sendNotifyMail] 发送失败:', toEmail, type, err.message || err);
    return false;
  }
}
