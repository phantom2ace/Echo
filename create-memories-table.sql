-- Create a table for public/private memories and patterns
create table if not exists memories (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  memory_type text not null, -- e.g. 'behavior_pattern', 'productivity_pattern', 'preference'
  content text not null,     -- The detailed observation statement
  confidence numeric default 0.0, -- AI/algorithmic confidence level between 0 and 1
  source text not null,      -- e.g. 'rules_engine', 'ai_reflection', 'user_input'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table memories enable row level security;

-- Create policies for data isolation (confirming users can only access their own data)
create policy "Users can only read their own memories" on memories
  for select using (auth.uid() = user_id);

create policy "Users can only insert their own memories" on memories
  for insert with check (auth.uid() = user_id);

create policy "Users can only update their own memories" on memories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can only delete their own memories" on memories
  for delete using (auth.uid() = user_id);
