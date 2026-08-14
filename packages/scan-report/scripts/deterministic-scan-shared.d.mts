/**
 * Type declarations for deterministic-scan-shared.mjs, scoped to the one export
 * a TypeScript consumer imports — `makeFindingId`, to reproduce the same
 * finding identities when re-deriving detail from a raw artifact. The rest of
 * the module is runner-only machinery (parseRunContext, writeArtifacts, …) that
 * nothing imports from TypeScript, and declaring it would imply a typed
 * contract this package does not intend to keep.
 */

export function makeFindingId(
  ruleId: string,
  locationPath: string,
  locationHint: string,
  message: string,
): string;
