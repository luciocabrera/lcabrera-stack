export const formatMetadataLabel = (rawKey: string) => {
  const normalized = rawKey
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll(/[_-]+/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim();

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};
