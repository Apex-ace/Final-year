-- extra tables: conversations, messages, reviews, blocked_users, favorites

create extension if not exists "uuid-ossp";

create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  participant1_id uuid not null references profiles(id) on delete cascade,
  participant2_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  reviewer_id uuid not null references profiles(id) on delete cascade,
  reviewee_id uuid not null references profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now()
);

create table if not exists blocked_users (
  id uuid primary key default uuid_generate_v4(),
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  favorite_user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now()
);
