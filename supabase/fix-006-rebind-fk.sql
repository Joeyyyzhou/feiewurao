-- ============================================
-- 非鹅勿扰 · fix-006 · 修所有 FK 从 _legacy_users 改回 public.users
-- ============================================
-- 根因：dating 36 问时代的老 users 表被 RENAME 成 _legacy_users 了，
-- 但 bottles/quotas/conversations/messages/blocks/reports 各表的 FK
-- 当时是建在 users 上，rename 后 FK 自动跟着指向 _legacy_users。
-- schema.sql 用 CREATE TABLE IF NOT EXISTS 不会重建表，所以新建的
-- public.users 没有这些表反向 FK 依赖。
-- 现象：throw_bottle / pick_bottle 等所有写操作都 FK 失败。
-- 修法：DROP 旧 FK，重建指向 public.users 的新 FK。
-- ============================================

-- 先批量看一下哪些表的 FK 指向 _legacy_users
DO $$
DECLARE
  fk RECORD;
  fixed_count int := 0;
BEGIN
  FOR fk IN
    SELECT
      tc.table_schema,
      tc.table_name,
      tc.constraint_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON rc.unique_constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND ccu.table_name = '_legacy_users'
  LOOP
    -- DROP 老 FK
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', fk.table_name, fk.constraint_name);
    -- 加新 FK 指向 public.users
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.users(id) ON DELETE CASCADE',
      fk.table_name, fk.constraint_name, fk.column_name
    );
    fixed_count := fixed_count + 1;
    RAISE NOTICE '✓ fix FK: public.%.%(%) -> public.users(id)', fk.table_name, fk.constraint_name, fk.column_name;
  END LOOP;

  RAISE NOTICE '════════════ 共修复 % 个 FK ════════════', fixed_count;
END$$;

-- 验证：再查一次 FK 应该都指向 public.users 了
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS references_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND ccu.table_name IN ('users', '_legacy_users')
ORDER BY tc.table_name;
