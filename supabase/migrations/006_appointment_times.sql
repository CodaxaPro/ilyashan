-- Planned arrival time and estimated job duration on appointments
alter table appointments add column if not exists planned_start_time text;
alter table appointments add column if not exists estimated_duration_hours numeric;
