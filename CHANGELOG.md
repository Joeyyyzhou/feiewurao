# 非鹅勿扰漂流瓶 · v0.1 骨架交付

> 2026-05-10 06:30 完成第一阶段。

## 这一夜（实际是 30 分钟）做了什么

✅ 起独立 git 仓库 `feiewurao-app/`（旧 dating 代码 `feiewuraoo/` 不动，自带 git history 作为存档）
✅ React 18 + TS + Vite + Tailwind 项目骨架
✅ 路由：landing / register / sea / friends / me / throw / pick / chat
✅ Supabase client + database.types
✅ AuthProvider + RequireAuth 守卫
✅ 8 个核心页面**视觉完整**（沿用 demo 全部样式）
✅ 业务调用点全部接好（throw/pick/reply/toss/end/block/report），但 RPC 调用先 stub TODO(接力)
✅ Supabase schema SQL：users / bottles / conversations / messages / blocks / reports / quotas
✅ RLS 策略 + 触发器（注册自动建 profile 含 bottle_no + avatar_color）
✅ 5 个 RPC：throw_bottle / pick_bottle / submit_reply / toss_bottle / end_conversation
✅ 敏感词 Edge Function 占位
✅ 移动端响应式（@media max-width 768px）
✅ 占位视频复制到 public/
✅ .env.example
✅ git commit 进度可回退

## 没做的（坦诚说）

❌ 没真连 Supabase 跑——schema.sql 没执行
❌ 没真接 throw/pick/reply 的 RPC 调用，前端只是 stub
❌ 没部署 Vercel
❌ video skill 今日额度耗尽，4 段时段视频没生
❌ 移动端只是断点，没真测过

**为什么没做**：
我作为这个对话里的 AI，**没有"睡觉时持续运行"的能力**——当你停止打字 / 我这条 message 发完后，我就停止运行了。说"整夜跑"是不诚实的。

**怎么补**：
1. 已经设了 automation_update 接力任务（早 7:30 自动启动新 session 续命）
2. 即使接力失败，骨架已经齐全，你 1 小时内能跑通 P0

---

## 你早起后的 3 件事（10 分钟搞定第一件）

### ① 把 Supabase schema 跑起来（5 分钟）

1. 打开 https://supabase.com/dashboard/project/xarpwuvsbmytbbauktlm
2. SQL Editor → New Query
3. 复制 `feiewurao-app/supabase/schema.sql` 全部内容粘贴 → Run
4. 看到 `✓ schema deployed` 即成功
5. 旁边 Settings → API 复制 **anon public key**

### ② 配置 .env（2 分钟）

```bash
cd /Users/zhouying/WorkBuddy/20260407191510/feiewurao-app
cp .env.example .env
# 编辑 .env，把 anon key 粘进去
```

### ③ 跑起来看（3 分钟）

```bash
cd /Users/zhouying/WorkBuddy/20260407191510/feiewurao-app
npm install   # 第一次约 1-2 分钟
npm run dev
# 浏览器打开 http://localhost:5173
```

应该能看到首页，注册流程能用真鹅厂邮箱跑通（OTP 邮件会到你邮箱）。

## 之后的 4 件中型任务（接力 automation 会跑，或我们一起做）

A. 把 Throw / Pick / Chat 三页的 stub 换成真 RPC 调用（约 2 小时）
B. 部署 Vercel preview（5 分钟，需要你 vercel login 或我用现有 token）
C. 用 video skill 生 4 段时段视频（额度恢复后，30 分钟）
D. 切自有 SMTP（QQ 企业邮箱 / 腾讯云 SES，避免 OTP 限频）

---

## 仓库结构

```
feiewurao-app/
├── public/ocean-mediterranean.mp4   # 占位背景视频
├── src/
│   ├── lib/
│   │   ├── supabase.ts              # client
│   │   ├── auth.tsx                 # AuthProvider + useAuth
│   │   └── database.types.ts        # 手写类型
│   ├── components/
│   │   ├── AppNav.tsx               # 顶部 4 tab
│   │   ├── BgVideo.tsx              # 全屏视频 + 时段切换 hook
│   │   ├── Avatar.tsx               # 8 色三色渐变
│   │   └── RequireAuth.tsx          # 路由守卫
│   ├── pages/
│   │   ├── Landing.tsx              # 首页（理念页）
│   │   ├── Register.tsx             # 注册/登录（OTP）
│   │   ├── Sea.tsx                  # 海 tab
│   │   ├── Friends.tsx              # 瓶友 tab
│   │   ├── Me.tsx                   # 我 tab
│   │   ├── Throw.tsx                # 扔瓶
│   │   ├── Pick.tsx                 # 捞瓶 + 回信编辑器 + 举报
│   │   └── Chat.tsx                 # 一对一聊天 + 菜单
│   ├── App.tsx
│   ├── main.tsx                     # 路由
│   └── index.css                    # 全局样式 + 移动端响应
├── supabase/
│   ├── schema.sql                   # 全部 schema + RLS + 触发器 + RPC
│   └── functions/sensitive-check/index.ts   # 敏感词 Edge Function
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── .env.example
└── .gitignore
```

## 回退保险

老 dating 代码 `feiewuraoo/` 完整保留，自带 git history。
新代码 `feiewurao-app/` 是独立 git，每个里程碑 commit。
出问题随时可以丢掉重来。
