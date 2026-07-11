-- Extended geolocation fields for corporate analytics
alter table analytics_sessions
  add column if not exists region text,
  add column if not exists region_code text,
  add column if not exists continent text,
  add column if not exists timezone text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists service_area_zone text,
  add column if not exists service_area_match text,
  add column if not exists in_service_area boolean;

create index if not exists idx_analytics_sessions_country on analytics_sessions(country);
create index if not exists idx_analytics_sessions_city on analytics_sessions(city);
create index if not exists idx_analytics_sessions_service_area on analytics_sessions(in_service_area);
