-- FOCUS application database schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: profiles
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role text not null check (role in ('user', 'admin')) default 'user',
  created_at timestamp with time zone default now()
);

-- Table: notes
create table if not exists notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Table: tasks
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  is_completed boolean default false,
  created_at timestamp with time zone default now()
);

-- Table: flashcards
create table if not exists flashcards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  front text not null,
  back text not null,
  created_at timestamp with time zone default now()
);

-- Table: activity_logs
create table if not exists activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  action text not null,
  created_at timestamp with time zone default now()
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;
alter table notes enable row level security;
alter table tasks enable row level security;
alter table flashcards enable row level security;
alter table activity_logs enable row level security;

-- Create Secure Admin Check Function (Bypasses RLS to avoid infinite recursion)
create or replace function public.is_admin()
returns boolean as $$
declare
  user_role text;
begin
  select role into user_role from public.profiles where id = auth.uid();
  return user_role = 'admin';
end;
$$ language plpgsql security definer set search_path = public;

-- Admin Policies: Admins can do everything
create policy "Admins can view all profiles" on profiles for select using ( public.is_admin() );
create policy "Admins can manage all profiles" on profiles for all using ( public.is_admin() );

create policy "Admins can view all notes" on notes for select using ( public.is_admin() );
create policy "Admins can manage all notes" on notes for all using ( public.is_admin() );

create policy "Admins can view all tasks" on tasks for select using ( public.is_admin() );
create policy "Admins can manage all tasks" on tasks for all using ( public.is_admin() );

create policy "Admins can view all flashcards" on flashcards for select using ( public.is_admin() );
create policy "Admins can manage all flashcards" on flashcards for all using ( public.is_admin() );

create policy "Admins can view all activity_logs" on activity_logs for select using ( public.is_admin() );
create policy "Admins can manage all activity_logs" on activity_logs for all using ( public.is_admin() );

-- User Policies: Users can only access their own data
create policy "Users can view their own profile" on profiles for select using ( auth.uid() = id );
create policy "Users can update their own profile" on profiles for update using ( auth.uid() = id );

create policy "Users can manage their own notes" on notes for all using ( auth.uid() = user_id );
create policy "Users can manage their own tasks" on tasks for all using ( auth.uid() = user_id );
create policy "Users can manage their own flashcards" on flashcards for all using ( auth.uid() = user_id );
create policy "Users can manage their own activity_logs" on activity_logs for all using ( auth.uid() = user_id );

-- Automated update timestamp function for notes
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
before update on notes
for each row
execute procedure handle_updated_at();

-- Trigger to automatically insert a profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
