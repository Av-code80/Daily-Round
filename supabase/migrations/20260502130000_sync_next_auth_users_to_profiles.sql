-- ============================================================
-- Sync next_auth.users → public.profiles  (full re-point)
-- ============================================================
-- Why:
--   Auth.js + Supabase adapter writes users into next_auth.users,
--   not into auth.users. profiles.id used to FK auth.users, so:
--     • Auth.js users could never get a profile row.
--     • Any FK to profiles (tournees, door_codes.contributed_by,
--       employer_reviews, …) failed with 23503.
-- Fix:
--   1. Drop the old FK on profiles.id.
--   2. Drop orphan profile rows (if any) so the new FK can apply.
--   3. Re-point profiles.id at next_auth.users.
--   4. Back-fill profiles for existing Auth.js users.
--   5. Trigger on next_auth.users so future sign-ups stay in sync.
--   6. Remove the now-dead trigger on auth.users.
-- ============================================================

-- 1. Drop the old FK to auth.users
alter table public.profiles
  drop constraint profiles_id_fkey;

-- 2. Remove orphan profile rows whose id is not in next_auth.users
delete from public.profiles
where id not in (select id from next_auth.users);

-- 3. Re-point profiles.id → next_auth.users(id)
alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references next_auth.users(id) on delete cascade;

-- 4. Back-fill profiles for every existing Auth.js user
insert into public.profiles (id, username)
select u.id, coalesce(split_part(u.email, '@', 1), 'driver')
from next_auth.users u
where u.id not in (select id from public.profiles);

-- 5. Trigger function for future Auth.js sign-ups
create or replace function public.handle_new_next_auth_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(split_part(new.email, '@', 1), 'driver'))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- 6. Trigger on next_auth.users
drop trigger if exists on_next_auth_user_created on next_auth.users;
create trigger on_next_auth_user_created
  after insert on next_auth.users
  for each row execute function public.handle_new_next_auth_user();

-- 7. Remove the dead auth.users trigger
drop trigger if exists on_auth_user_created on auth.users;
