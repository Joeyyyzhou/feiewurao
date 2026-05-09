# 非鹅勿扰 · 设计系统参考库

本目录存放从 [voltagent/awesome-design-md](https://github.com/voltagent/awesome-design-md) 抽取的顶级网站设计系统文件，用来给 AI 代理做"风格复刻"参考。

## 已内置的 8 套设计系统

| 目录 | 品牌 | 调性 | 何时用 |
|------|------|------|-------|
| `superhuman/` | Superhuman | 深紫 Mysteria + 奶油白 + 薰衣草紫 | **当前主推** · 奢华 / 克制 / 信封感 |
| `linear.app/` | Linear | 极简深色 + 精确动效 | 产品/工具调性 |
| `raycast/` | Raycast | 纯黑底 + 命令行 + 红黄蓝绿饱和点缀 | 开发者工具 / 终端感 |
| `vercel/` | Vercel | 纯黑白 + Geist + 大留白 | 极简 / 禅意 |
| `notion/` | Notion | 暖米 + 衬线 + 软色块 | 编辑 / 笔记 / 温暖 |
| `resend/` | Resend | 浅白 + 优雅衬线 | 开发者 SaaS 克制感 |
| `stripe/` | Stripe | 深蓝 + 渐变 + 大尺度层级 | 金融 / 科技 / 高大上 |
| `claude/` | Claude | 暖米 + 黏土橙 + 编辑衬线 | 学术 / 可信 / 考究 |

## 如何使用

### 选项 A：直接复刻已有风格

你对我说："**用 Resend 的风格重做嘉宾页**" 或 "**切到 Notion 调性**"，我会直接读对应目录下的 `DESIGN.md`，抽取色板、字体、组件规范、动效规则，应用到指定页面。

### 选项 B：丢一个新链接

你给我一个链接（例如 `https://air.inc`），我会：

1. 用 WebFetch / 浏览器自动化截图和分析页面
2. 按 awesome-design-md 的 9 段式规范提取：
   - Visual theme & atmosphere
   - Color palette（带语义命名）
   - Typography rules（完整字号阶梯）
   - Component styling
   - Layout principles（spacing scale、grid、radius）
   - Depth & elevation
   - Do's and Don'ts
   - Responsive behavior
   - Agent prompt guide
3. 生成一个新的 `DESIGN.md` 存到这里
4. 按这份规范重建页面

### 选项 C：安装完整复刻 pipeline（可选）

如果需要更极致的像素级复刻，可以启用 [fukuball/ai-website-cloner-template](https://github.com/fukuball/ai-website-cloner-template)：
- 它用 Chrome MCP 完整扫描目标站
- 抓 `getComputedStyle()` 所有值
- 生成一个 Next.js 项目像素级克隆

目前**非鹅勿扰还是 React + Vite 项目**，不需要全站克隆，用选项 A/B 已够。

## 设计系统选择原则

1. **当前推荐：Superhuman** —— 产品调性（匿名、深度、成年人、腾讯内部高端）高度契合
2. **避免：任何紫色 + 渐变 + 毛玻璃 + emoji 主视觉** —— 典型 AI slop
3. **每次重构只聚焦一套系统** —— 不要混 Linear 的字体 + Superhuman 的色板 + Stripe 的布局

## 工作流

```
用户: "用 XX 网站的风格给 YY 页面重新设计一版"
  ↓
我: 读 .design-refs/xx/DESIGN.md
  ↓
我: 提取核心 tokens（color / type / spacing / radius / motion）
  ↓
我: 应用到 YY 页面的 Tailwind / CSS 变量
  ↓
我: 生成 demo HTML 给用户预览
  ↓
用户确认 → 改 React 源码 → git push → 自动部署
```

## 目前已做的 demo

- `demo-direction-A.html` — 信件美学（信封+衬线）
- `demo-direction-note.html` — 小纸条（便签+图钉）
- `demo-direction-air.html` — Air.inc 风（深黑+磨砂玻璃+暖光）
- `demo-direction-superhuman.html` — **Superhuman 风**（Mysteria 紫+奶油+薰衣草）← 当前推荐
