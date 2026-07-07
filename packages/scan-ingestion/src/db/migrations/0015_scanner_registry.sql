-- Scanner registry (ADR-023, Phase-3 Step 9). The scanners reference table
-- grows into a full registry: description, versioning (with a snapshot
-- history table), the deterministic-runner command template (metadata ONLY
-- — the orchestrator executes DETERMINISTIC_SCANNER_CONFIGS' code-owned
-- script paths, never DB-stored commands), config detection, the LLM
-- allowlist and steps markdown. Registration/update go through
-- p_user_id-first functions asserting 'create'/'update' on 'scanner'
-- (admin-only per the 0008 seeds); every write snapshots into
-- cqms.scanner_versions. A registry-added scanner without a bespoke
-- migration gets an auto-created generic detail table
-- (cqms.scanner_detail_<id>, identifier sanitized to [a-z0-9_]) fed by
-- sp_ingest_generic_detail.

ALTER TABLE cqms.scanners
  ADD COLUMN description            text,
  ADD COLUMN version                integer NOT NULL DEFAULT 1,
  ADD COLUMN command_template       text,     -- '{target}/{scope}/{outputDir}' placeholders, documentation only
  ADD COLUMN raw_artifact_file_name text,
  ADD COLUMN config_detection       jsonb,
  ADD COLUMN allowed_tools          jsonb,
  ADD COLUMN steps_markdown         text;

CREATE TABLE cqms.scanner_versions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scanner_id  text NOT NULL REFERENCES cqms.scanners(scanner_id) ON DELETE CASCADE,
  version     integer NOT NULL,
  snapshot    jsonb NOT NULL,      -- the registry fields at this version (audit columns stripped)
  created_by  uuid REFERENCES cqms.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scanner_id, version)
);

-- ── Read views (ADR-018 rule) ────────────────────────────────────────────
-- v_scanners must be REPLACED: `SELECT *` expands at view-creation time, so
-- the 0009 version does not include the new columns.

CREATE OR REPLACE VIEW cqms.v_scanners AS
  SELECT * FROM cqms.scanners WHERE deleted_at IS NULL;

CREATE VIEW cqms.v_scanner_versions AS
  SELECT * FROM cqms.scanner_versions;

-- ── Registry write functions ─────────────────────────────────────────────

CREATE FUNCTION cqms.fn_register_scanner(p_user_id uuid, p_scanner jsonb)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  v_scanner_id text := p_scanner->>'scanner_id';
  v_row cqms.scanners;
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'create', 'scanner');

  -- Same character set as the generic detail table's sanitized identifier
  -- (minus the '-'→'_' mapping) and short enough that
  -- 'scanner_detail_' || id stays under Postgres' 63-char identifier limit.
  IF v_scanner_id IS NULL OR v_scanner_id !~ '^[a-z0-9][a-z0-9-]{0,47}$' THEN
    RAISE EXCEPTION 'scanner_id must match ^[a-z0-9][a-z0-9-]{0,47}$ (got "%").', v_scanner_id;
  END IF;
  IF EXISTS (SELECT 1 FROM cqms.scanners WHERE scanner_id = v_scanner_id) THEN
    RAISE EXCEPTION 'Scanner "%" already exists.', v_scanner_id;
  END IF;

  INSERT INTO cqms.scanners (scanner_id, display_name, skill_path,
    deterministic, supports_diff_scope, is_active, description,
    command_template, raw_artifact_file_name, config_detection,
    allowed_tools, steps_markdown, version, created_by)
  SELECT v_scanner_id, s.display_name,
         coalesce(s.skill_path, '.github/skills/' || v_scanner_id),
         coalesce(s.deterministic, false),
         coalesce(s.supports_diff_scope, false),
         coalesce(s.is_active, true),
         s.description, s.command_template, s.raw_artifact_file_name,
         s.config_detection, s.allowed_tools, s.steps_markdown, 1, p_user_id
  FROM jsonb_to_record(p_scanner) AS s(display_name text, skill_path text,
    deterministic boolean, supports_diff_scope boolean, is_active boolean,
    description text, command_template text, raw_artifact_file_name text,
    config_detection jsonb, allowed_tools jsonb, steps_markdown text)
  RETURNING * INTO v_row;

  INSERT INTO cqms.scanner_versions (scanner_id, version, snapshot, created_by)
  VALUES (v_row.scanner_id, 1,
          to_jsonb(v_row) - 'created_by' - 'created_at' - 'edited_by' - 'edited_at' - 'deleted_at',
          p_user_id);

  RETURN v_row.scanner_id;
END;
$$;

CREATE FUNCTION cqms.fn_update_scanner(
  p_user_id uuid, p_scanner_id text, p_scanner jsonb
) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  v_row cqms.scanners;
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'scanner');

  -- scanner_id and skill_path stay immutable: the id is a natural key other
  -- tables reference, and the on-disk artifact location is code-owned.
  UPDATE cqms.scanners SET
    display_name           = coalesce(p_scanner->>'display_name', display_name),
    deterministic          = coalesce((p_scanner->>'deterministic')::boolean, deterministic),
    supports_diff_scope    = coalesce((p_scanner->>'supports_diff_scope')::boolean, supports_diff_scope),
    is_active              = coalesce((p_scanner->>'is_active')::boolean, is_active),
    description            = coalesce(p_scanner->>'description', description),
    command_template       = coalesce(p_scanner->>'command_template', command_template),
    raw_artifact_file_name = coalesce(p_scanner->>'raw_artifact_file_name', raw_artifact_file_name),
    config_detection       = coalesce(p_scanner->'config_detection', config_detection),
    allowed_tools          = coalesce(p_scanner->'allowed_tools', allowed_tools),
    steps_markdown         = coalesce(p_scanner->>'steps_markdown', steps_markdown),
    version                = version + 1,
    edited_by              = p_user_id,
    edited_at              = now()
  WHERE scanner_id = p_scanner_id AND deleted_at IS NULL
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Scanner "%" not found.', p_scanner_id;
  END IF;

  INSERT INTO cqms.scanner_versions (scanner_id, version, snapshot, created_by)
  VALUES (v_row.scanner_id, v_row.version,
          to_jsonb(v_row) - 'created_by' - 'created_at' - 'edited_by' - 'edited_at' - 'deleted_at',
          p_user_id);

  RETURN v_row.version;
END;
$$;

-- ── Generic detail table (interview decision 8) ──────────────────────────
-- Dynamic DDL with a strictly sanitized identifier: only [a-z0-9_], length
-- bounded, and always applied through format('%I').

CREATE FUNCTION cqms.fn_create_scanner_detail_table(
  p_user_id uuid, p_scanner_id text
) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  v_sanitized text := lower(replace(p_scanner_id, '-', '_'));
  v_table text;
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'create', 'scanner');

  IF NOT EXISTS (SELECT 1 FROM cqms.scanners WHERE scanner_id = p_scanner_id) THEN
    RAISE EXCEPTION 'Scanner "%" is not registered.', p_scanner_id;
  END IF;
  IF v_sanitized !~ '^[a-z0-9_]{1,48}$' THEN
    RAISE EXCEPTION 'Sanitized scanner id "%" must match ^[a-z0-9_]{1,48}$.', v_sanitized;
  END IF;

  v_table := 'scanner_detail_' || v_sanitized;

  EXECUTE format('CREATE TABLE IF NOT EXISTS cqms.%I (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id     uuid NOT NULL REFERENCES cqms.scans(id) ON DELETE CASCADE,
    payload     jsonb NOT NULL,
    created_by  uuid REFERENCES cqms.users(id),
    created_at  timestamptz NOT NULL DEFAULT now())', v_table);
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON cqms.%I (scan_id)',
                 v_table || '_scan_idx', v_table);
  EXECUTE format('CREATE OR REPLACE VIEW cqms.%I AS SELECT * FROM cqms.%I',
                 'v_' || v_table, v_table);

  RETURN v_table;
END;
$$;

CREATE PROCEDURE cqms.sp_ingest_generic_detail(
  p_user_id uuid, p_scan_id uuid, p_rows jsonb
) LANGUAGE plpgsql AS $$
DECLARE
  v_scanner_id text;
  v_sanitized text;
  v_table text;
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'scan', p_scan_id);

  SELECT scanner_id INTO v_scanner_id FROM cqms.scans WHERE id = p_scan_id;
  IF v_scanner_id IS NULL THEN
    RAISE EXCEPTION 'Scan % not found.', p_scan_id;
  END IF;

  v_sanitized := lower(replace(v_scanner_id, '-', '_'));
  IF v_sanitized !~ '^[a-z0-9_]{1,48}$' THEN
    RAISE EXCEPTION 'Sanitized scanner id "%" must match ^[a-z0-9_]{1,48}$.', v_sanitized;
  END IF;
  v_table := 'scanner_detail_' || v_sanitized;

  IF to_regclass('cqms.' || v_table) IS NULL THEN
    RAISE EXCEPTION 'Generic detail table cqms.% does not exist — fn_create_scanner_detail_table runs at registration.', v_table;
  END IF;

  EXECUTE format('DELETE FROM cqms.%I WHERE scan_id = $1', v_table)
    USING p_scan_id;
  EXECUTE format('INSERT INTO cqms.%I (scan_id, payload, created_by)
                  SELECT $1, value, $2 FROM jsonb_array_elements($3)', v_table)
    USING p_scan_id, p_user_id, p_rows;
END;
$$;

-- ── Backfill the existing scanners into the new registry columns ─────────
-- steps_markdown stays NULL for all of them: their SKILL.md / runner
-- scripts on disk are authoritative (the registry never overwrites code).

UPDATE cqms.scanners SET
  description = 'Deterministic ESLint run (this repo''s flat config + custom rules). Per-violation detail rows + 1:1 master (ADR-019).',
  command_template = 'node .github/skills/linter-checker/scripts/generate-eslint-report.mjs --target={target} --scope={scope} --output-dir={outputDir} --skip-ingest',
  raw_artifact_file_name = 'eslint.raw.json'
WHERE scanner_id = 'eslint';

UPDATE cqms.scanners SET
  description = 'Deterministic Oxlint run. Per-violation detail rows + 1:1 master (ADR-019).',
  command_template = 'node .github/skills/linter-checker/scripts/generate-oxlint-report.mjs --target={target} --scope={scope} --output-dir={outputDir} --skip-ingest',
  raw_artifact_file_name = 'oxlint.raw.json'
WHERE scanner_id = 'oxlint';

UPDATE cqms.scanners SET
  description = 'Deterministic fallow CLI run (dead code, duplication, complexity, health). Wide 1:1 master + 8 detail tables (ADR-019 addendum).',
  command_template = 'node .github/skills/fallow-code-checker/scripts/generate-fallow-report.mjs --target={target} --scope={scope} --output-dir={outputDir} --skip-ingest',
  raw_artifact_file_name = 'fallow.raw.json'
WHERE scanner_id = 'fallow';

UPDATE cqms.scanners SET
  description = 'Deterministic structure inventory: nested folder/file node tree with per-file export/function/type counts via ts-morph. 0 findings by design (ADR-022).',
  command_template = 'node .github/skills/app-graph/scripts/generate-app-graph-report.mjs --target={target} --scope={scope} --output-dir={outputDir} --skip-ingest',
  raw_artifact_file_name = 'app-graph.raw.json'
WHERE scanner_id = 'app-graph';

UPDATE cqms.scanners SET
  description = 'LLM code-smell audit over a folder scope (severity, confidence, effort). Master = findings rollup; detail = view over scan_findings.',
  allowed_tools = '["Bash(cat:*,date:*,git:*,mkdir:*,node:*,tee:*)","Read","Grep","Glob"]'::jsonb
WHERE scanner_id = 'code-smell-checker';

UPDATE cqms.scanners SET
  description = 'LLM code-smell audit over a diff scope (code-smell-zen flavor). Master = findings rollup; detail = view over scan_findings.',
  allowed_tools = '["Bash(cat:*,date:*,git:*,mkdir:*,node:*,tee:*)","Read","Grep","Glob"]'::jsonb
WHERE scanner_id = 'code-smell-zen';

UPDATE cqms.scanners SET
  description = 'Retired combined linter (split into eslint + oxlint by ADR-019). Kept for historical scans.'
WHERE scanner_id = 'linter';

-- Every pre-registry scanner gets its v1 snapshot so the history table is
-- complete from day one.
INSERT INTO cqms.scanner_versions (scanner_id, version, snapshot)
SELECT s.scanner_id, s.version,
       to_jsonb(s) - 'created_by' - 'created_at' - 'edited_by' - 'edited_at' - 'deleted_at'
FROM cqms.scanners s
ON CONFLICT (scanner_id, version) DO NOTHING;
