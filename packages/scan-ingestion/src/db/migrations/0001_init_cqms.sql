-- CQMS schema — deliberately NOT `public`. All CQMS objects are
-- schema-qualified (`cqms.*`) rather than relying on `search_path`, so every
-- migration file and every consumer query is self-contained and unambiguous
-- regardless of session config.
CREATE SCHEMA IF NOT EXISTS cqms;

-- All primary keys are uuid (gen_random_uuid() is built into PostgreSQL 13+
-- core — confirmed no pgcrypto extension needed on this instance, PG 18).
-- scanners.scanner_id stays text — it's a natural key ('fallow', 'linter',
-- ...), not a surrogate.

CREATE TABLE cqms.projects (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  local_path       text NOT NULL UNIQUE,   -- realpath-canonicalized; the ad hoc matching key
  default_branch   text NOT NULL DEFAULT 'main',
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_scanned_at  timestamptz
);

-- Reference table (not a CHECK enum) so adding a 5th scanner is a data
-- insert, not a migration.
CREATE TABLE cqms.scanners (
  scanner_id           text PRIMARY KEY,      -- 'fallow' | 'linter' | 'code-smell-checker' | 'code-smell-zen'
  display_name         text NOT NULL,
  skill_path           text NOT NULL,          -- '.github/skills/fallow-code-checker'
  deterministic        boolean NOT NULL,       -- true only when finding-generation needs zero LLM judgment
  supports_diff_scope  boolean NOT NULL DEFAULT false,
  is_active            boolean NOT NULL DEFAULT true
);

CREATE TABLE cqms.runs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          uuid NOT NULL REFERENCES cqms.projects(id) ON DELETE CASCADE,
  origin              text NOT NULL CHECK (origin IN ('ui_agent_sdk','interactive_session','ci')),
  triggered_by        text,       -- user/session identifier, nullable
  status              text NOT NULL DEFAULT 'queued'
                       CHECK (status IN ('queued','running','succeeded','failed','partially_failed','canceled')),
  requested_scanners  jsonb NOT NULL DEFAULT '[]'::jsonb,
  git_commit_sha      text,
  git_branch          text,
  started_at          timestamptz,
  finished_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE cqms.runs ADD CONSTRAINT runs_id_project_unique UNIQUE (id, project_id);
CREATE INDEX runs_project_created_idx ON cqms.runs (project_id, created_at DESC);

CREATE TABLE cqms.scans (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id             uuid NOT NULL,
  project_id         uuid NOT NULL,
  scanner_id         text NOT NULL REFERENCES cqms.scanners(scanner_id),
  status             text NOT NULL DEFAULT 'queued'
                      CHECK (status IN ('queued','running','succeeded','failed','canceled')),
  scope_type         text NOT NULL CHECK (scope_type IN ('repo','folder','changed-files','diff')),
  scope_value        text NOT NULL,
  base_branch        text,
  head_branch        text,
  commit_range       text,
  started_at         timestamptz,
  finished_at        timestamptz,
  duration_ms        integer,
  progress_message   text,
  error_message      text,
  raw_json           jsonb,      -- complete untouched artifact; feeds "copy raw JSON" + the JSON-table explorer
  raw_artifact_path  text,
  health_metrics     jsonb,      -- free-form aggregate metrics (fallow vital_signs/hotspots), no shared contract
  created_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scans_run_project_fk FOREIGN KEY (run_id, project_id) REFERENCES cqms.runs(id, project_id) ON DELETE CASCADE
);
CREATE INDEX scans_run_idx ON cqms.scans (run_id);
CREATE INDEX scans_project_scanner_created_idx ON cqms.scans (project_id, scanner_id, created_at DESC);

CREATE TABLE cqms.reports (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id           uuid NOT NULL UNIQUE REFERENCES cqms.scans(id) ON DELETE CASCADE,
  schema_version    text NOT NULL DEFAULT '1.0',
  report_id         text NOT NULL,
  generated_at      timestamptz NOT NULL,
  report_markdown   text NOT NULL,
  report_json       jsonb NOT NULL,
  files_analyzed    integer NOT NULL DEFAULT 0,
  blocker_count     integer NOT NULL DEFAULT 0,
  high_count        integer NOT NULL DEFAULT 0,
  medium_count      integer NOT NULL DEFAULT 0,
  low_count         integer NOT NULL DEFAULT 0,
  nit_count         integer NOT NULL DEFAULT 0,
  top_risk          text,
  created_at        timestamptz NOT NULL DEFAULT now()
);
-- Severity counts are flattened out of report_json into real columns because
-- the trend view and runs table need to sort/filter/aggregate across many
-- rows; report_json stays the verbatim render source, these are a projection.

CREATE TABLE cqms.scan_findings (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id              uuid NOT NULL REFERENCES cqms.scans(id) ON DELETE CASCADE,
  finding_id           text NOT NULL,
  rule_id              text NOT NULL,
  severity             text NOT NULL CHECK (severity IN ('BLOCKER','HIGH','MEDIUM','LOW','NIT')),
  confidence           text NOT NULL CHECK (confidence IN ('high','medium','low')),
  location_path        text NOT NULL,
  location_hint        text,
  evidence_excerpt     text,
  why                  text NOT NULL,
  fix                  text NOT NULL,
  effort               text CHECK (effort IN ('small','medium','large')),
  defer_risk           text,
  verification_steps   jsonb NOT NULL DEFAULT '[]'::jsonb,
  status               text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in-progress','done','deferred')),
  owner                text,
  dependencies         jsonb,
  related_findings     jsonb,
  tags                 jsonb,
  finding_kind         text NOT NULL DEFAULT 'single_location' CHECK (finding_kind IN ('single_location','duplication_group')),
  extra                jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scan_id, finding_id)
);
CREATE INDEX scan_findings_scan_idx ON cqms.scan_findings (scan_id);
CREATE INDEX scan_findings_scan_severity_idx ON cqms.scan_findings (scan_id, severity);
CREATE INDEX scan_findings_location_idx ON cqms.scan_findings (location_path);

-- Per-file inventory for the run's project snapshot. Only populated for
-- whole-project scopes (repo/folder); empty for diff-only runs
-- (code-smell-zen alone). Captures nested_level now (path depth from
-- project root) so Phase 2's dependency graph has the raw material it
-- needs. NOTE: there is deliberately no separate run_file_stats TABLE —
-- the category rollup is a VIEW over this table (0003_views.sql), not a
-- second app-maintained copy of the same fact.
CREATE TABLE cqms.run_files (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id             uuid NOT NULL REFERENCES cqms.runs(id) ON DELETE CASCADE,
  file_path          text NOT NULL,   -- project-relative
  file_type_category text NOT NULL,  -- suffix-convention category: component, hook, util, service_api, repository, controller, route, types, stylex, constants, schema, test, other
  extension          text NOT NULL,  -- raw extension, e.g. '.tsx', '.ts' — distinct from category
  nested_level       integer NOT NULL, -- directory depth from project root
  line_count         integer,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, file_path)
);
CREATE INDEX run_files_run_idx ON cqms.run_files (run_id);
CREATE INDEX run_files_run_category_idx ON cqms.run_files (run_id, file_type_category);
