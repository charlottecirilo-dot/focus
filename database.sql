-- FOCUS application database schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: profiles
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  created_at timestamp with time zone default now()
);

-- Table: notes
create table if not exists public.notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Table: tasks
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  is_completed boolean default false,
  created_at timestamp with time zone default now()
);

-- Table: flashcards
create table if not exists public.flashcards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  front text not null,
  back text not null,
  created_at timestamp with time zone default now()
);

-- Table: activity_logs
create table if not exists public.activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  action text not null,
  created_at timestamp with time zone default now()
);

-- Table: transcription_sessions
create table if not exists public.transcription_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  note_id uuid references notes(id) on delete cascade not null,
  transcript text not null,
  language text not null default 'en-US',
  word_count integer not null default 0,
  duration_seconds integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.notes enable row level security;
alter table public.tasks enable row level security;
alter table public.flashcards enable row level security;
alter table public.activity_logs enable row level security;
alter table public.transcription_sessions enable row level security;

-- Drop all explicit known policies to ensure a clean slate
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can manage all profiles" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can delete their own profile" on public.profiles;
drop policy if exists "Anyone can view profiles" on public.profiles;

drop policy if exists "Admins can view all notes" on public.notes;
drop policy if exists "Admins can manage all notes" on public.notes;
drop policy if exists "Users can manage their own notes" on public.notes;

drop policy if exists "Admins can view all tasks" on public.tasks;
drop policy if exists "Admins can manage all tasks" on public.tasks;
drop policy if exists "Users can manage their own tasks" on public.tasks;

drop policy if exists "Admins can view all flashcards" on public.flashcards;
drop policy if exists "Admins can manage all flashcards" on public.flashcards;
drop policy if exists "Users can manage their own flashcards" on public.flashcards;

drop policy if exists "Admins can view all activity_logs" on public.activity_logs;
drop policy if exists "Admins can manage all activity_logs" on public.activity_logs;
drop policy if exists "Users can manage their own activity_logs" on public.activity_logs;

drop policy if exists "Admins can view all transcription sessions" on public.transcription_sessions;
drop policy if exists "Admins can manage all transcription sessions" on public.transcription_sessions;
drop policy if exists "Users can manage their own transcription sessions" on public.transcription_sessions;

-- Drop old admin-specific structures
drop function if exists public.is_admin();
drop trigger if exists on_profile_role_change on public.profiles;
drop function if exists public.sync_admin_users();
drop policy if exists "Anyone can read admin_users" on public.admin_users;
drop table if exists public.admin_users cascade;

-- User Policies: Users can access and manage their own data exclusively
create policy "Users can view their own profile" on profiles for select using ( auth.uid() = id );
create policy "Users can update their own profile" on profiles for update using ( auth.uid() = id );
-- Note: users aren't generally allowed to delete or insert profiles manually since Auth handles it.

create policy "Users can manage their own notes" on notes for all using ( auth.uid() = user_id );
create policy "Users can manage their own tasks" on tasks for all using ( auth.uid() = user_id );
create policy "Users can manage their own flashcards" on flashcards for all using ( auth.uid() = user_id );
create policy "Users can manage their own activity_logs" on activity_logs for all using ( auth.uid() = user_id );
create policy "Users can manage their own transcription sessions" on transcription_sessions for all using ( auth.uid() = user_id );

-- Automated update timestamp function for notes
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on notes;
create trigger set_updated_at
before update on notes
for each row
execute procedure handle_updated_at();

-- Trigger to automatically insert a profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Note: "role" column has been removed. Simply insert id and email.
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger safely
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
