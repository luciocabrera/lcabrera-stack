const SAFE_IDENTIFIER_PATTERN = /^[a-z_][a-z0-9_]*$/;

export const assertSafeIdentifier = (identifier: string) => {
  if (!SAFE_IDENTIFIER_PATTERN.test(identifier)) {
    throw new Error(`Unsafe identifier: "${identifier}"`);
  }
};
