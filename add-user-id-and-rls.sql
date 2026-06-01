
-- Add user_id column to all tables
alter table areas add column if not exists user_id uuid references auth.users(id);
alter table goals add column if not exists user_id uuid references auth.users(id);
alter table tasks add column if not exists user_id uuid references auth.users(id);
alter table courses add column if not exists user_id uuid references auth.users(id);
alter table projects add column if not exists user_id uuid references auth.users(id);
alter table weekly_reviews add column if not exists user_id uuid references auth.users(id);
alter table activity_log add column if not exists user_id uuid references auth.users(id);
alter table daily_stats add column if not exists user_id uuid references auth.users(id);

-- Enable RLS on all tables
alter table areas enable row level security;
alter table goals enable row level security;
alter table tasks enable row level security;
alter table courses enable row level security;
alter table projects enable row level security;
alter table weekly_reviews enable row level security;
alter table activity_log enable row level security;
alter table daily_stats enable row level security;

-- Create RLS policies for each table
create policy "Users can only access their own areas"
on areas for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can only access their own goals"
on goals for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can only access their own tasks"
on tasks for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can only access their own courses"
on courses for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can only access their own projects"
on projects for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can only access their own weekly reviews"
on weekly_reviews for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can only access their own activity log"
on activity_log for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can only access their own daily stats"
on daily_stats for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
