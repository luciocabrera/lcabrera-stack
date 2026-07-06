export type RunSkillAgentArgs = {
  /** Reported as the session streams — → scans.progress_message + WebSocket push (TECH_SPEC §2.7). */
  readonly onProgress?: (message: string) => void;
  readonly outputDirectory: string;
  readonly scannerId: ScannerId;
  readonly scopeArgument?: string;
  /** '.github/skills/<dir>' inside the CQMS repo itself (TECH_SPEC §2.6). */
  readonly skillPath: string;
  /** Absolute, canonicalized — the project being scanned. */
  readonly targetProjectPath: string;
};

/**
 * Not specified in TECH_SPEC.md (only referenced by name) — designed here:
 * runSkillAgent's job stops at "produce files on disk, return their paths"
 * (TECH_SPEC §2.6), so the result is just that plus enough telemetry for
 * the caller to persist alongside the scan row.
 */
export type RunSkillAgentResult = {
  readonly errorMessage?: string;
  readonly numTurns?: number;
  readonly rawJsonPath?: string;
  readonly reportJsonPath?: string;
  readonly reportMarkdownPath?: string;
  readonly success: boolean;
  readonly totalCostUsd?: number;
};

export type ScannerId =
  | 'code-smell-checker'
  | 'code-smell-zen'
  | 'fallow'
  | 'linter';
