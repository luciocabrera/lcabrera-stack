export const quoteIdentifier = (identifier: string): string =>
  `"${identifier.replaceAll('"', '""')}"`;
