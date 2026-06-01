-- 1. Ensure feedback table has the status column
alter table feedback add column if not exists status text default 'open' not null;

-- 2. Drop existing restrictive select policy on feedback if needed
drop policy if exists "Users can only read their own feedback submissions" on feedback;

-- 3. Re-create feedback policies to allow users to read their own and admins to read all
create policy "Users can read their own feedback" on feedback
  for select using (
    auth.uid() = user_id or 
    auth.jwt() ->> 'email' = 'spadeellis20@gmail.com'
  );

create policy "Admins can update feedback status" on feedback
  for update using (
    auth.jwt() ->> 'email' = 'spadeellis20@gmail.com'
  ) with check (
    auth.jwt() ->> 'email' = 'spadeellis20@gmail.com'
  );

-- 4. Create secure RPC function to get global admin stats bypassing RLS safely
create or replace function get_admin_stats()
returns json
security definer
set search_path = public
language plpgsql
as $$
declare
  total_users integer;
  total_goals integer;
  total_tasks integer;
  total_reviews integer;
  current_user_email text;
begin
  -- Get caller email from Supabase Auth JWT
  current_user_email := auth.jwt() ->> 'email';
  
  -- Security enforcement: only allow verified founder emails
  if current_user_email != 'spadeellis20@gmail.com' or current_user_email is null then
    raise exception 'Access Denied: Unauthorized founder account';
  end if;
  
  select count(*) into total_users from public.profiles;
  select count(*) into total_goals from public.goals;
  select count(*) into total_tasks from public.tasks;
  select count(*) into total_reviews from public.weekly_reviews;
  
  return json_build_object(
    'users', total_users,
    'goals', total_goals,
    'tasks', total_tasks,
    'reviews', total_reviews
  );
end;
$$;
