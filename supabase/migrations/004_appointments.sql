-- Ilyashan operations calendar (Supabase PostgreSQL)
-- Run in Supabase SQL Editor or via CLI

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  lead_id text not null,
  role text not null,
  anfrage_nr text,
  kind text not null default 'single' check (kind in ('single', 'wartung')),
  status text not null check (status in ('vorgeschlagen', 'bestätigt', 'erledigt', 'storniert')),
  event_date date not null,
  time_slot text check (time_slot in ('vormittag', 'nachmittag', 'ganztags', 'flexibel')),
  customer_name text not null,
  customer_email text,
  customer_phone text,
  postal_code text,
  city text,
  title text not null,
  notes text,
  lead_status text,
  source text,
  window_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_id, role)
);

create index if not exists appointments_event_date_idx on appointments (event_date);
create index if not exists appointments_lead_id_idx on appointments (lead_id);
create index if not exists appointments_status_idx on appointments (status);

create or replace function appointments_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists appointments_updated_at on appointments;
create trigger appointments_updated_at
  before update on appointments
  for each row execute function appointments_set_updated_at();
