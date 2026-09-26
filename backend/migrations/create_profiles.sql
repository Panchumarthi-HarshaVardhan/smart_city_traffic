-- CITYFLOW AI - User Profiles Table & Row Level Security
-- Run this in the Supabase SQL Editor to enable the relational profiles table

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    email text,
    home_city text,
    home_state text,
    home_display_name text,
    home_latitude double precision,
    home_longitude double precision,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Drop existing policies if any
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can delete own profile" on public.profiles;

-- RLS Policies: users can only access and modify their own profile
create policy "Users can view own profile"
    on public.profiles for select
    using ((select auth.uid()) = id);

create policy "Users can insert own profile"
    on public.profiles for insert
    with check ((select auth.uid()) = id);

create policy "Users can update own profile"
    on public.profiles for update
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);

create policy "Users can delete own profile"
    on public.profiles for delete
    using ((select auth.uid()) = id);
