-- 第二段：视图 + RLS策略
-- 复制全部内容到 Supabase SQL Editor 点 Run

CREATE VIEW daily_pv_summary AS
SELECT date, COUNT(*) as pv_count
FROM page_views
GROUP BY date
ORDER BY date DESC;

CREATE VIEW user_stats AS
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE gender = 'male') as male_count,
  COUNT(*) FILTER (WHERE gender = 'female') as female_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_today
FROM users;

CREATE VIEW city_distribution AS
SELECT base_city, COUNT(*) as user_count
FROM users
GROUP BY base_city
ORDER BY user_count DESC;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE light_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE light_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert PV" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read PV count" ON page_views FOR SELECT USING (true);
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (true);
CREATE POLICY "Anyone can register" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can insert answers" ON answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read answers" ON answers FOR SELECT USING (true);
CREATE POLICY "Insert light actions" ON light_actions FOR INSERT WITH CHECK (true);
CREATE POLICY "Read light actions" ON light_actions FOR SELECT USING (true);
CREATE POLICY "Insert notifications" ON light_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Read notifications" ON light_notifications FOR SELECT USING (true);
CREATE POLICY "Update notifications" ON light_notifications FOR UPDATE USING (true);
CREATE POLICY "Insert matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Read matches" ON matches FOR SELECT USING (true);
