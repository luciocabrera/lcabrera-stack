-- Idempotent seed — safe to re-run (ON CONFLICT DO NOTHING), so migrations
-- stay replayable end-to-end on a fresh database.
INSERT INTO cqms.scanners (scanner_id, display_name, skill_path, deterministic, supports_diff_scope, is_active)
VALUES
  ('fallow', 'Fallow Code Checker', '.github/skills/fallow-code-checker', false, false, true),
  ('code-smell-checker', 'Code Smell Checker', '.github/skills/code-smell-checker', false, false, true),
  ('code-smell-zen', 'Code Smell Zen', '.github/skills/code-smell-zen', false, true, true),
  ('linter', 'Linter (oxlint + eslint)', '.github/skills/linter-checker', true, false, true)
ON CONFLICT (scanner_id) DO NOTHING;
