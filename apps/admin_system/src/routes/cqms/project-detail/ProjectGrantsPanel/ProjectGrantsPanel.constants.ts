/**
 * Curated per-instance grant options for a project (ADR-024) — value is
 * 'action:resourceType' with resource_id = the project uuid. execute:scan
 * is exactly the tuple fn_create_run asserts (0009); read grants are
 * deliberately absent (list reads are not per-instance gated today).
 */
export const PROJECT_GRANT_OPTIONS = [
  { label: 'Trigger scans', value: 'execute:scan' },
  { label: 'Ingest scan results', value: 'update:scan' },
  { label: 'Edit project', value: 'update:project' },
] as const;
