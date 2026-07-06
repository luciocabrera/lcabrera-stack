import type { ScannerId, ScopeType } from './report.schema.ts';

export type IngestReportArgs = {
  readonly localPath: string;
  readonly origin: IngestReportOrigin;
  /** Complete untouched original artifact (e.g. fallow.raw.json) — feeds scans.raw_json. Only fallow populates this today. */
  readonly rawJsonPath?: string;
  readonly reportJsonPath: string;
  readonly reportMarkdownPath: string;
  /** UI path: attach to an existing run/scan. Ad hoc path: omit, both are created. */
  readonly runId?: string;
  readonly scannerId: ScannerId;
  readonly scopeType: ScopeType;
  readonly scopeValue: string;
  readonly triggeredBy?: string;
  /** The acting user for audit fields + fn_assert_permission (ADR-018). Non-interactive callers (orchestrator, CLI) resolve the seeded 'system' user. */
  readonly userId: string;
};

export type IngestReportOrigin = 'ci' | 'interactive_session' | 'ui_agent_sdk';

export type IngestReportResult = {
  readonly findingsIngested: number;
  readonly projectId: string;
  readonly reportId: string;
  readonly runId: string;
  readonly scanId: string;
};
