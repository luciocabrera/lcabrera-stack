/**
 * Formats a token timestamp for display — a locale-independent
 * `YYYY-MM-DD HH:MM:SS` slice (keeps SSR and client markup identical), or an
 * em dash for a null column (never-used / never-expires).
 */
export const formatTokenTimestamp = (value: null | string): string =>
  value ? value.slice(0, 19).replace('T', ' ') : '—';
