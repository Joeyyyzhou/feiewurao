import nodemailer from 'nodemailer';

let transporter = null;
export function getTransporter() {
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

export function inviteCodeMail(toEmail, code) {
  return {
    from: '"非鹅勿扰漂流瓶" <noreply@feiewurao.cn>',
    to: toEmail,
    subject: '🌊 你的邀请码到了 — 非鹅勿扰漂流瓶',
    html: `
      <div style="max-width:480px;margin:0 auto;padding:36px;font-family:-apple-system,'PingFang SC',sans-serif;text-align:center;background:#fafaf9;border-radius:16px">
        <div style="font-size:42px;margin-bottom:12px">🌊</div>
        <h2 style="color:#1E1833;margin-bottom:8px;font-size:20px">你的邀请码到了</h2>
        <p style="color:#5C5480;font-size:14px;margin-bottom:28px;line-height:1.8">
          欢迎来到非鹅勿扰漂流瓶，<br/>
          一个仅鹅厂员工可用的匿名漂流瓶社区
        </p>
        <div style="background:#fff;border:2px solid #1E1833;border-radius:14px;padding:24px;margin-bottom:24px">
          <p style="color:#9B93B5;font-size:11px;letter-spacing:3px;margin-bottom:10px;margin-top:0">YOUR INVITE CODE</p>
          <p style="color:#1E1833;font-size:32px;letter-spacing:10px;margin:0;font-weight:600;font-family:'Cormorant Garamond',serif">${code}</p>
        </div>
        <a href="https://feiewurao.cn/register" style="display:inline-block;background:#1E1833;color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:500;font-size:15px;letter-spacing:2px">
          进入海面
        </a>
        <p style="color:#9B93B5;font-size:12px;margin-top:24px;line-height:1.7">
          邀请码一次性有效 · 仅限本邮箱注册<br/>
          在鹅厂扔一个瓶子，可能有人懂你
        </p>
      </div>
    `,
  };
}

export function passwordResetMail(toEmail, code) {
  return {
    from: '"非鹅勿扰漂流瓶" <noreply@feiewurao.cn>',
    to: toEmail,
    subject: '🔐 重置密码验证码 — 非鹅勿扰漂流瓶',
    html: `
      <div style="max-width:480px;margin:0 auto;padding:36px;font-family:-apple-system,'PingFang SC',sans-serif;text-align:center;background:#fafaf9;border-radius:16px">
        <div style="font-size:42px;margin-bottom:12px">🔐</div>
        <h2 style="color:#1E1833;margin-bottom:8px;font-size:20px">重置密码</h2>
        <p style="color:#5C5480;font-size:14px;margin-bottom:28px;line-height:1.8">
          你正在重置非鹅勿扰漂流瓶的密码，<br/>
          15 分钟内有效
        </p>
        <div style="background:#fff;border:2px solid #1E1833;border-radius:14px;padding:24px;margin-bottom:24px">
          <p style="color:#9B93B5;font-size:11px;letter-spacing:3px;margin-bottom:10px;margin-top:0">VERIFICATION CODE</p>
          <p style="color:#1E1833;font-size:34px;letter-spacing:14px;margin:0;font-weight:600;font-family:'Cormorant Garamond',serif">${code}</p>
        </div>
        <p style="color:#9B93B5;font-size:12px;margin-top:8px;line-height:1.7">
          如果不是你本人操作请忽略此邮件 · 验证码 15 分钟内有效
        </p>
      </div>
    `,
  };
}

export function registerCodeMail(toEmail, code) {
  return {
    from: '"非鹅勿扰漂流瓶" <noreply@feiewurao.cn>',
    to: toEmail,
    subject: '🌊 注册验证码 — 非鹅勿扰漂流瓶',
    html: `
      <div style="max-width:480px;margin:0 auto;padding:36px;font-family:-apple-system,'PingFang SC',sans-serif;text-align:center;background:#fafaf9;border-radius:16px">
        <div style="font-size:42px;margin-bottom:12px">🌊</div>
        <h2 style="color:#1E1833;margin-bottom:8px;font-size:20px">欢迎登船</h2>
        <p style="color:#5C5480;font-size:14px;margin-bottom:28px;line-height:1.8">
          你正在注册非鹅勿扰漂流瓶，<br/>
          一个仅鹅厂员工可用的匿名漂流瓶社区
        </p>
        <div style="background:#fff;border:2px solid #1E1833;border-radius:14px;padding:24px;margin-bottom:24px">
          <p style="color:#9B93B5;font-size:11px;letter-spacing:3px;margin-bottom:10px;margin-top:0">VERIFICATION CODE</p>
          <p style="color:#1E1833;font-size:34px;letter-spacing:14px;margin:0;font-weight:600;font-family:'Cormorant Garamond',serif">${code}</p>
        </div>
        <p style="color:#9B93B5;font-size:12px;margin-top:8px;line-height:1.7">
          回到页面输入验证码即可完成注册 · 验证码 10 分钟内有效<br/>
          如果不是你本人操作请忽略此邮件
        </p>
      </div>
    `,
  };
}
