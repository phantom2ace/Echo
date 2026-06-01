-- Create a table for public profiles
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;

-- Create policies
create policy "Allow public read access to profiles" on profiles
  for select using (true);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- Function to handle new user signup and extract username
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  raw_username text;
  final_username text;
  username_exists boolean;
  counter integer := 1;
begin
  -- 1. Extract username from metadata or fallback to email prefix
  raw_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  raw_username := lower(trim(raw_username));
  final_username := raw_username;

  -- 2. Make sure username is unique by appending numbers if it is already taken
  loop
    select exists(select 1 from public.profiles where username = final_username) into username_exists;
    exit when not username_exists;
    final_username := raw_username || counter;
    counter := counter + 1;
  end loop;

  -- 3. Insert user profile
  insert into public.profiles (id, username, email)
  values (new.id, final_username, new.email);
  
  return new;
end;
$$;

-- Trigger to automatically create a profile record on auth signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
