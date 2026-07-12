-- Ilyashan: verify all Supabase migrations (001–006)
-- Run in Supabase SQL Editor.
-- Expect last row: 17 OK / 17 toplam, status = TAMAM

WITH expected AS (
  SELECT * FROM (VALUES
    ('001', 'table',  'analytics_visitors',           NULL::text),
    ('001', 'table',  'analytics_sessions',           NULL::text),
    ('001', 'table',  'analytics_events',             NULL::text),
    ('002', 'column', 'analytics_sessions',           'fbclid'),
    ('003', 'column', 'analytics_sessions',           'region'),
    ('003', 'column', 'analytics_sessions',           'region_code'),
    ('003', 'column', 'analytics_sessions',           'continent'),
    ('003', 'column', 'analytics_sessions',           'timezone'),
    ('003', 'column', 'analytics_sessions',           'latitude'),
    ('003', 'column', 'analytics_sessions',           'longitude'),
    ('003', 'column', 'analytics_sessions',           'service_area_zone'),
    ('003', 'column', 'analytics_sessions',           'service_area_match'),
    ('003', 'column', 'analytics_sessions',           'in_service_area'),
    ('004', 'table',  'appointments',                 NULL::text),
    ('005', 'column', 'appointments',                 'staff_id'),
    ('006', 'column', 'appointments',                 'planned_start_time'),
    ('006', 'column', 'appointments',                 'estimated_duration_hours')
  ) AS t(migration, kind, object_name, column_name)
),
checks AS (
  SELECT
    e.migration,
    e.kind,
    CASE
      WHEN e.column_name IS NULL THEN e.object_name
      ELSE e.object_name || '.' || e.column_name
    END AS item,
    CASE
      WHEN e.kind = 'table' AND t.table_name IS NOT NULL THEN 'OK'
      WHEN e.kind = 'column' AND c.column_name IS NOT NULL THEN 'OK'
      ELSE 'MISSING'
    END AS status
  FROM expected e
  LEFT JOIN information_schema.tables t
    ON e.kind = 'table'
   AND t.table_schema = 'public'
   AND t.table_name = e.object_name
  LEFT JOIN information_schema.columns c
    ON e.kind = 'column'
   AND c.table_schema = 'public'
   AND c.table_name = e.object_name
   AND c.column_name = e.column_name
),
summary AS (
  SELECT
    COUNT(*) FILTER (WHERE status = 'OK') AS ok_count,
    COUNT(*) FILTER (WHERE status = 'MISSING') AS missing_count,
    CASE
      WHEN COUNT(*) FILTER (WHERE status = 'MISSING') = 0
      THEN 'TAMAM – tüm migration''lar uygulanmış'
      ELSE 'EKSİK VAR – MISSING satırlarına bak'
    END AS sonuc
  FROM checks
)
SELECT migration, kind, item, status
FROM (
  SELECT
    0 AS sort_order,
    migration,
    kind,
    item,
    status
  FROM checks
  UNION ALL
  SELECT
    1 AS sort_order,
    '---' AS migration,
    'ÖZET' AS kind,
    s.ok_count::text || ' OK / ' || (s.ok_count + s.missing_count)::text || ' toplam' AS item,
    s.sonuc AS status
  FROM summary s
) combined
ORDER BY sort_order, migration, item;
