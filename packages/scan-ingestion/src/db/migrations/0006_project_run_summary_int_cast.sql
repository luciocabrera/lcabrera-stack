-- Real bug caught by a live query, not inspection: sum(rep.high_count) /
-- sum(rep.medium_count) return bigint, which node-postgres returns as a JS
-- string (not number) to avoid silent precision loss on values exceeding
-- Number.MAX_SAFE_INTEGER. total_high/total_medium are small counts that
-- will never approach that range, so the explicit ::int cast here is safe
-- and gives callers a real number instead of a string to remember to parse.
-- CREATE OR REPLACE cannot change an existing column's output type
-- (Postgres error 42P16) — only DROP+CREATE can, and nothing else
-- references this view yet (confirmed: it's newly consumed by this same
-- step's getProjectListView.util.ts), so dropping it is safe here.
DROP VIEW cqms.project_run_summary;

CREATE VIEW cqms.project_run_summary AS
  SELECT p.*, lr.run_id AS latest_run_id, lr.status AS latest_run_status,
         lr.total_high::int AS total_high, lr.total_medium::int AS total_medium
  FROM cqms.projects p
  LEFT JOIN LATERAL (
    SELECT r.id AS run_id, r.status,
           sum(rep.high_count) AS total_high, sum(rep.medium_count) AS total_medium
    FROM cqms.runs r JOIN cqms.reports rep ON rep.scan_id IN (SELECT id FROM cqms.scans WHERE run_id = r.id)
    WHERE r.project_id = p.id
    GROUP BY r.id ORDER BY r.created_at DESC LIMIT 1
  ) lr ON true;
