-- Staff assignment on calendar appointments (optional column)
alter table appointments add column if not exists staff_id text;

create index if not exists appointments_staff_id_idx on appointments (staff_id);
