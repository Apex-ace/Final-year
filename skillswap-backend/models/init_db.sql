-- initial SQL to create profiles and skills tables

create extension if not exists "uuid-ossp";

-- Profiles table (separate from Supabase auth users)
create table if not exists profiles (
  id uuid primary key,
  email text,
  full_name text,
  username text unique,
  bio text,
  city text,
  country text,
  latitude numeric,
  longitude numeric,
  profile_image_url text,
  average_rating numeric default 0,
  reviews_count int default 0,
  last_active_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists skills (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null
);

create table if not exists user_skills_offered (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade
);

create table if not exists user_skills_wanted (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade
);
