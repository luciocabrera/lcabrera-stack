const SAFE_IDENTIFIER_PATTERN = /^[a-z_][a-z0-9_]*$/;

/**
 * Mandatory, always called, no caller opt-out — the safety floor for every
 * schema/table/column identifier this package builds a query around.
 * Purely syntactic (shape/character validation), not an authorization
 * check against a permitted set of values — see assertColumnAllowed for
 * that, which callers opt into per query.
 */
export const assertSafeIdentifier = (identifier: string): void => {
  if (!SAFE_IDENTIFIER_PATTERN.test(identifier)) {
    throw new Error(`Unsafe identifier: "${identifier}"`);
  }
};
