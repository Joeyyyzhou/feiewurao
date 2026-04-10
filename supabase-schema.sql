-- ============================================
-- 非鹅勿扰 Supabase Database Schema
-- 在 Supabase Dashboard > SQL Editor 中执行
-- ============================================

-- 1. 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  base_city TEXT NOT NULL,
  wechat_id TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  pref_gender TEXT NOT NULL CHECK (pref_gender IN ('male', 'female')),
  pref_base_cities TEXT[] DEFAULT '{}',
  order_num SERIAL,
  day_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 每日回答表
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id INT NOT NULL,
  content TEXT NOT NULL,
  answered_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_answers_user ON answers(user_id);
CREATE INDEX idx_answers_date ON answers(answered_date);

-- 3. 留灯/灭灯记录
CREATE TABLE light_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('on', 'off')),
  question_id INT,
  session_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_light_from ON light_actions(from_user_id);
CREATE INDEX idx_light_to ON light_actions(to_user_id);

-- 4. 留灯通知（双向留灯判断用）
CREATE TABLE light_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'ignored', 'expired')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_light_notif_to ON light_notifications(to_user_id, status);

-- 5. 匹配记录
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  matched_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PV 访问统计
CREATE TABLE page_views (
  id BIGSERIAL PRIMARY KEY,
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE
);
CREATE INDEX idx_pv_date ON page_views(date);

-- 7. 每日问题分配记录
CREATE TABLE daily_question_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_ids INT[] NOT NULL,
  assigned_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_dqa_user_date ON daily_question_assignments(user_id, assigned_date);

-- ============================================
-- 视图：管理后台用
-- ============================================

-- 每日 PV 汇总
CREATE VIEW daily_pv_summary AS
SELECT date, COUNT(*) as pv_count
FROM page_views
GROUP BY date
ORDER BY date DESC;

-- 用户统计概览
CREATE VIEW user_stats AS
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE gender = 'male') as male_count,
  COUNT(*) FILTER (WHERE gender = 'female') as female_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_today
FROM users;

-- 城市分布
CREATE VIEW city_distribution AS
SELECT base_city, COUNT(*) as user_count
FROM users
GROUP BY base_city
ORDER BY user_count DESC;

-- ============================================
-- RLS (Row Level Security) 策略
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE light_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE light_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- PV: 任何人可插入，只有管理端可查询
CREATE POLICY "Anyone can insert PV" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read PV count" ON page_views FOR SELECT USING (true);

-- Users: 自己可以读自己，注册时可插入
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (true);
CREATE POLICY "Anyone can register" ON users FOR INSERT WITH CHECK (true);

-- Answers: 自己可以读写
CREATE POLICY "Users can insert answers" ON answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read answers" ON answers FOR SELECT USING (true);

-- Light actions: 可插入可读
CREATE POLICY "Insert light actions" ON light_actions FOR INSERT WITH CHECK (true);
CREATE POLICY "Read light actions" ON light_actions FOR SELECT USING (true);

-- Light notifications: 可插入可读
CREATE POLICY "Insert notifications" ON light_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Read notifications" ON light_notifications FOR SELECT USING (true);
CREATE POLICY "Update notifications" ON light_notifications FOR UPDATE USING (true);

-- Matches: 可插入可读
CREATE POLICY "Insert matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Read matches" ON matches FOR SELECT USING (true);
