-- 举报表
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  question_id INTEGER,
  answer_content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 拉黑表
CREATE TABLE IF NOT EXISTS blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- 允许 anon 插入举报
CREATE POLICY "Anyone can report" ON reports FOR INSERT WITH CHECK (true);
-- 管理员可查看所有举报
CREATE POLICY "Anyone can read reports" ON reports FOR SELECT USING (true);

-- 允许 anon 插入和查询拉黑
CREATE POLICY "Anyone can block" ON blocks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read blocks" ON blocks FOR SELECT USING (true);

-- 索引
CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_reports_to_user ON reports(to_user_id);
