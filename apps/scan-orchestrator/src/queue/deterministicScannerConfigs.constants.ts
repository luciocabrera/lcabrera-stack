export type DeterministicScannerConfig = {
  /** The raw artifact the runner script writes into the scan output directory (verbatim tool output + kind discriminator). */
  readonly rawArtifactFileName: string;
  /** Runner script path relative to the CQMS repo root. */
  readonly scriptPath: string;
};

export type DeterministicScannerId = keyof typeof DETERMINISTIC_SCANNER_CONFIGS;

/**
 * Deterministic scanner_id → runner script (ADR-019). A TS map, NOT a DB
 * column: executing DB-stored script paths would widen the attack surface,
 * and a new deterministic scanner needs an on-disk script (a code change)
 * anyway — the scanners reference table's "5th scanner is a data insert"
 * benefit doesn't apply to executables. Every script honors the same flag
 * contract: --target=<abs> --scope=<rel|'.'> --output-dir=<dir>
 * --skip-ingest, and degrades gracefully (0-findings report) rather than
 * crashing on a broken target (ADR-015).
 */
export const DETERMINISTIC_SCANNER_CONFIGS = {
  eslint: {
    rawArtifactFileName: 'eslint.raw.json',
    scriptPath:
      '.github/skills/linter-checker/scripts/generate-eslint-report.mjs',
  },
  fallow: {
    rawArtifactFileName: 'fallow.raw.json',
    scriptPath:
      '.github/skills/fallow-code-checker/scripts/generate-fallow-report.mjs',
  },
  oxlint: {
    rawArtifactFileName: 'oxlint.raw.json',
    scriptPath:
      '.github/skills/linter-checker/scripts/generate-oxlint-report.mjs',
  },
} as const satisfies Record<string, DeterministicScannerConfig>;

export const isDeterministicScannerId = (
  scannerId: string,
): scannerId is DeterministicScannerId =>
  Object.hasOwn(DETERMINISTIC_SCANNER_CONFIGS, scannerId);
