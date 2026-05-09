# 早晨 ToDo · 给睡醒的 Joey

## ☀️ 第一件事：跑通骨架（10 分钟）

```bash
# 1. 部署 Supabase schema（5 分钟）
# 浏览器打开：
#   https://supabase.com/dashboard/project/xarpwuvsbmytbbauktlm/sql/new
# 粘贴执行：
cat /Users/zhouying/WorkBuddy/20260407191510/feiewurao-app/supabase/schema.sql

# 2. 复制 anon key 到 .env
# Dashboard → Settings → API → anon public
cd /Users/zhouying/WorkBuddy/20260407191510/feiewurao-app
cp .env.example .env
# 编辑 .env，粘贴 key

# 3. 跑起来
npm install
npm run dev
# 打开 http://localhost:5173
```

## 🌊 第二件事：真接 RPC（自己做 / 让我做都行）

需要把这几个 stub 替换成真 RPC 调用：

- `Throw.tsx` 的 `submit()` → `supabase.rpc('throw_bottle', { p_content, p_mood })`
- `Pick.tsx` 的 `useEffect` → `supabase.rpc('pick_bottle')`
- `Pick.tsx` 的 `sendReply()` → `supabase.rpc('submit_reply', {...})`
- `Pick.tsx` 的 `tossBack()` → `supabase.rpc('toss_bottle', { p_bottle_id })`
- `Chat.tsx` 的 `send()` → `supabase.from('messages').insert(...)` + Realtime subscribe
- `Friends.tsx` 的 `useEffect` → query conversations + last messages
- `Me.tsx` 的 stats useEffect → 三个 count
- `Me.tsx` 的 blockList → query blocks JOIN users
- `Pick.tsx` 的 `submitReport()` → insert reports

## 🎬 第三件事：明天有视频额度后（约 30 分钟）

```bash
# 在这个对话里发我：
"video skill 额度刷了，帮我生 4 段时段视频替换占位"
```

## 📮 第四件事：自有 SMTP（30 分钟，避免 OTP 限频）

Supabase 默认 SMTP 每小时只发 3-4 封，鹅厂同事多的话会卡。

最方便的是腾讯云 SES：
1. https://console.cloud.tencent.com/ses
2. 验证发信域名（用你已有的 `feiewurao.cn`）
3. 拿到 SMTP 凭证（Host / Port / User / Pass）
4. Supabase Dashboard → Authentication → SMTP Settings → 填进去

## 🚀 第五件事：部署 Vercel preview（5 分钟）

```bash
cd /Users/zhouying/WorkBuddy/20260407191510/feiewurao-app
vercel link  # 选 joeyyyzhous-projects → 新建项目 feiewurao-app
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel deploy  # 给 preview 链接，先不 --prod
```

确认 preview 没问题再：
```bash
vercel --prod
# 然后到 Vercel dashboard 把 feiewurao.cn 域名指过来（如果你想替换）
```

---

# 总结：你的早上路径

1. ☕ **10 分钟**：跑 schema + .env + npm dev → 看到首页
2. ⏱ **半小时**：让我接 RPC（在对话里说 "接 RPC"，我就一个个改）
3. 🎬 **半小时**：生原创视频（让我做）
4. 🚀 **5 分钟**：vercel deploy preview
5. 📮 **可选 30 分钟**：配腾讯云 SES（也可以晚点做）

**总计 1.5 小时 → 真正能跑的内测版**。
