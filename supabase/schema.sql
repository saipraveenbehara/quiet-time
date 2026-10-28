-- Supabase Database Schema for Evidence-Informed Study Timer
-- Run this in the Supabase SQL Editor to set up tables and Row Level Security (RLS).

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  focus_area text,
  preferences jsonb default '{
    "defaultFocusDuration": 25,
    "defaultBreakDuration": 5,
    "soundEnabled": true,
    "encouragementStyle": "warm",
    "reducedMotion": false,
    "lowStimulation": false
  }'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Tasks Table
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  is_completed boolean default false,
  total_focus_seconds integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Sessions Table
create table if not exists public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  task_id uuid references public.tasks on delete set null,
  task_title text,
  duration_minutes integer not null,
  actual_seconds integer not null,
  completed boolean default true,
  reflection_note text,
  session_type text default 'focus',
  created_at timestamptz default now()
);

-- 4. Distraction Notes Table
create table if not exists public.distraction_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  session_id uuid references public.sessions on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- 5. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.sessions enable row level security;
alter table public.distraction_notes enable row level security;

-- 6. RLS Policies with explicit USING and WITH CHECK
drop policy if exists "Users can view and edit their own profile" on public.profiles;
create policy "Users can view and edit their own profile"
  on public.profiles for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can view and manage their own tasks" on public.tasks;
create policy "Users can view and manage their own tasks"
  on public.tasks for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can view and manage their own sessions" on public.sessions;
create policy "Users can view and manage their own sessions"
  on public.sessions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can view and manage their own distraction notes" on public.distraction_notes;
create policy "Users can view and manage their own distraction notes"
  on public.distraction_notes for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 7. Trigger to automatically create a profile record when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, focus_area)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'General Study'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
