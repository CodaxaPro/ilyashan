-- Ilyashan Analytics – first-party tracking (Supabase PostgreSQL)
-- Run in Supabase SQL Editor or via CLI: supabase db push

create extension if not exists "pgcrypto";

create table if not exists analytics_visitors (
  id uuid primary key default gen_random_uuid(),
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  consent_analytics boolean not null default true,
  device_fingerprint text
);

create table if not exists analytics_sessions (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null references analytics_visitors(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_ms integer not null default 0,
  is_bounce boolean not null default true,
  landing_path text not null,
  exit_path text,
  page_views integer not null default 0,
  event_count integer not null default 0,
  device_type text,
  browser text,
  os text,
  screen_width integer,
  screen_height integer,
  locale text,
  country text,
  city text,
  ip_hash text,
  referrer text,
  referrer_domain text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  gclid text,
  channel text not null default 'direct',
  created_at timestamptz not null default now()
);

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references analytics_sessions(id) on delete cascade,
  visitor_id uuid not null references analytics_visitors(id) on delete cascade,
  created_at timestamptz not null default now(),
  event_type text not null,
  page_path text not null,
  page_title text,
  element_id text,
  element_tag text,
  element_text text,
  element_href text,
  scroll_depth integer,
  duration_ms integer,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists idx_analytics_sessions_started_at on analytics_sessions(started_at desc);
create index if not exists idx_analytics_sessions_channel on analytics_sessions(channel);
create index if not exists idx_analytics_sessions_visitor on analytics_sessions(visitor_id);
create index if not exists idx_analytics_events_session on analytics_events(session_id, created_at);
create index if not exists idx_analytics_events_type on analytics_events(event_type, created_at desc);
create index if not exists idx_analytics_events_page on analytics_events(page_path, created_at desc);
create index if not exists idx_analytics_events_created on analytics_events(created_at desc);
