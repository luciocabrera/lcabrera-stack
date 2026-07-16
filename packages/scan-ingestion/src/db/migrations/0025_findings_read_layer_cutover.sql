-- Switch the workspace-attribution read layer over to v_all_findings
-- (ADR-028, Step 1e). scan_finding_workspaces (migration 0013) has no
-- consumers anywhere in the codebase yet (grepped clean), so this is a
-- free rebuild — no interface to preserve. f.id (a uuid, only meaningful
-- for cqms.scan_findings rows) is replaced by f.finding_id (the stable
-- hash every branch of v_all_findings carries), since a union across
-- differently-shaped detail tables has no single uuid identity to expose.

-- CREATE OR REPLACE VIEW cannot rename an existing output column
-- (scan_finding_id -> finding_id) — drop and recreate instead.
DROP VIEW cqms.scan_finding_workspaces;

CREATE VIEW cqms.scan_finding_workspaces AS
  SELECT f.finding_id, f.scan_id, s.project_id, f.location_path,
         w.workspace_path, w.workspace_name
  FROM cqms.v_all_findings f
  JOIN cqms.v_scans s ON s.id = f.scan_id
  LEFT JOIN LATERAL (
    SELECT pw.workspace_path, pw.workspace_name
    FROM cqms.project_workspaces pw
    WHERE pw.project_id = s.project_id
      AND f.location_path LIKE pw.workspace_path || '/%'
    ORDER BY length(pw.workspace_path) DESC
    LIMIT 1
  ) w ON true;
