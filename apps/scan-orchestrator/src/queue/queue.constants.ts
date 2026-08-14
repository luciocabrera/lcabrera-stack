export type DeterministicScannerId = keyof typeof DETERMINISTIC_SCANNER_CONFIGS;

/**
 * Where a runner lives. `installed` is a subpath of `@lcabrera/scan-report`,
 * resolved through node's module resolution so it works the same whether the
 * package is a workspace link or a registry install; `repository` is a path
 * relative to the CQMS repo root, for a scanner this repository owns.
 */
export type DeterministicScannerRunner =
  | { readonly kind: 'installed'; readonly specifier: string }
  | { readonly kind: 'repository'; readonly path: string };

type DeterministicScannerConfig = {
  /** The raw artifact the runner script writes into the scan output directory (verbatim tool output + kind discriminator). */
  readonly rawArtifactFileName: string;
  readonly runner: DeterministicScannerRunner;
};

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
  'app-graph': {
    rawArtifactFileName: 'app-graph.raw.json',
    runner: {
      kind: 'repository',
      path: '.github/skills/app-graph/scripts/generate-app-graph-report.mjs',
    },
  },
  eslint: {
    rawArtifactFileName: 'eslint.raw.json',
    runner: {
      kind: 'installed',
      specifier: '@lcabrera/scan-report/generate-eslint-report',
    },
  },
  fallow: {
    rawArtifactFileName: 'fallow.raw.json',
    runner: {
      kind: 'installed',
      specifier: '@lcabrera/scan-report/generate-fallow-report',
    },
  },
  oxlint: {
    rawArtifactFileName: 'oxlint.raw.json',
    runner: {
      kind: 'installed',
      specifier: '@lcabrera/scan-report/generate-oxlint-report',
    },
  },
} as const satisfies Record<string, DeterministicScannerConfig>;

export const isDeterministicScannerId = (
  scannerId: string,
): scannerId is DeterministicScannerId =>
  Object.hasOwn(DETERMINISTIC_SCANNER_CONFIGS, scannerId);
