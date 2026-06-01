-- Create a table to securely collect bug reports, feature requests, and critiques
create table if not exists feedback (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  type text not null,       -- e.g. 'bug', 'feature_request', 'aesthetic', 'other'
  message text not null,    -- The descriptive feedback content
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table feedback enable row level security;

-- Create policies for data isolation
create policy "Users can only read their own feedback submissions" on feedback
  for select using (auth.uid() = user_id);

create policy "Anyone can insert feedback (authenticated or anonymous)" on feedback
  for insert with check (true);
