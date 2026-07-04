/**
 * Convert a raw metadata key into a human-readable label.
 * Splits camelCase, replaces separators with spaces, and capitalizes.
 * @param rawKey - The raw metadata key.
 * @returns The humanized label.
 */
export const formatMetadataLabel = (rawKey: string): string => {
  const normalized = rawKey
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll(/[_-]+/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim();

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};
