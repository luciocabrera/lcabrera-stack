/**
 * Type declarations for deterministic-scan-shared.mjs, scoped to the one
 * export the TS detail extractors in packages/scan-ingestion actually
 * import (makeFindingId) — not a full re-declaration of this module's
 * runner-only machinery (parseRunContext, writeArtifacts, etc.), which
 * has no TS consumer.
 */

export function makeFindingId(
  ruleId: string,
  locationPath: string,
  locationHint: string,
  message: string,
): string;
