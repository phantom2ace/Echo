
create table if not exists courses (
  id bigint generated always as identity primary key,
  name text not null,
  progress int default 0,
  confidence int default 0,
  exam_date date,
  created_at timestamp default now()
);

create table if not exists projects (
  id bigint generated always as identity primary key,
  title text not null,
  status text default 'active',
  progress int default 0,
  last_touched timestamp,
  abandonment_reason text,
  created_at timestamp default now()
);

create table if not exists daily_stats (
  id bigint generated always as identity primary key,
  date date not null unique,
  tasks_added int default 0,
  tasks_completed int default 0,
  courses_studied int default 0,
  projects_touched int default 0
);
