-- Replaces a separate run_file_stats table — one source of truth
-- (cqms.run_files), the category rollup is just a query shape, not an
-- app-maintained second copy of the same fact.
CREATE VIEW cqms.run_file_stats AS
  SELECT run_id, file_type_category, count(*) AS file_count, sum(line_count) AS total_lines
  FROM cqms.run_files GROUP BY run_id, file_type_category;

-- Backs cqms/root.ts: each project joined to its latest run + that run's
-- rolled-up severity counts, via a LATERAL join instead of a loader-side
-- N+1 or a hand-assembled aggregate query.
CREATE VIEW cqms.project_run_summary AS
  SELECT p.*, lr.run_id AS latest_run_id, lr.status AS latest_run_status, lr.total_high, lr.total_medium
  FROM cqms.projects p
  LEFT JOIN LATERAL (
    SELECT r.id AS run_id, r.status,
           sum(rep.high_count) AS total_high, sum(rep.medium_count) AS total_medium
    FROM cqms.runs r JOIN cqms.reports rep ON rep.scan_id IN (SELECT id FROM cqms.scans WHERE run_id = r.id)
    WHERE r.project_id = p.id
    GROUP BY r.id ORDER BY r.created_at DESC LIMIT 1
  ) lr ON true;

-- Backs run-detail's Table and the WebSocket status payload.
CREATE VIEW cqms.run_scan_summary AS
  SELECT s.run_id, s.id AS scan_id, s.scanner_id, s.status, s.progress_message, s.duration_ms,
         rep.blocker_count, rep.high_count, rep.medium_count, rep.low_count, rep.nit_count
  FROM cqms.scans s LEFT JOIN cqms.reports rep ON rep.scan_id = s.id;

-- Backs the trend view's up/down indicator — run-over-run deltas computed
-- in SQL via a window function, not fetched-then-diffed in the loader.
CREATE VIEW cqms.project_scanner_trend AS
  SELECT r.project_id, s.scanner_id, r.id AS run_id, r.created_at,
         rep.high_count, rep.medium_count,
         rep.high_count - lag(rep.high_count) OVER w AS high_count_delta,
         rep.medium_count - lag(rep.medium_count) OVER w AS medium_count_delta
  FROM cqms.runs r JOIN cqms.scans s ON s.run_id = r.id JOIN cqms.reports rep ON rep.scan_id = s.id
  WINDOW w AS (PARTITION BY r.project_id, s.scanner_id ORDER BY r.created_at);
