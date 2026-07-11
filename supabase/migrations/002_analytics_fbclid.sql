-- Add Facebook click id to session attribution
alter table analytics_sessions
  add column if not exists fbclid text;
