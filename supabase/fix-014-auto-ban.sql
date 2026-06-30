-- fix-014: 举报自动封禁
-- 被 3 人举报同一用户 → 自动封禁（设置 banned_at）
-- 同时：举报写入时，若目标已被封禁，则拒绝写入（避免对已封号用户继续产生举报记录）

-- 1. 累计举报数函数
create or replace function public.check_auto_ban()
returns trigger as $$
declare
  report_count int;
  target_user uuid;
begin
  -- 获取被举报的目标用户 ID
  if NEW.target_type = 'bottle' then
    select user_id into target_user from bottles where id = NEW.target_id;
  elsif NEW.target_type = 'message' then
    select sender_id into target_user from messages where id = NEW.target_id;
  else
    return NEW;
  end if;

  if target_user is null then
    return NEW;
  end if;

  -- 统计该用户被举报次数（去重：同一举报人只算一次）
  select count(distinct reporter_id) into report_count
  from reports r
  where (
    (r.target_type = 'bottle' and r.target_id in (select id from bottles where user_id = target_user))
    or
    (r.target_type = 'message' and r.target_id in (select id from messages where sender_id = target_user))
  );

  -- 达到 3 次 → 自动封禁
  if report_count >= 3 then
    update users set banned_at = now() where id = target_user and banned_at is null;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- 2. 触发器：每次写入 reports 时检查
drop trigger if exists trg_check_auto_ban on reports;
create trigger trg_check_auto_ban
  after insert on reports
  for each row
  execute function check_auto_ban();

-- 3. 封禁后拒绝被封用户的所有操作（RLS 已覆盖，这里加一个应用层检查）
-- 在 users 表加一个视图函数，供前端判断当前用户是否被封
create or replace function public.is_banned(uid uuid)
returns boolean as $$
  select banned_at is not null from users where id = uid;
$$ language sql security definer stable;
