export const quoteIdentifier = (name: string) =>
  `"${name.replaceAll('"', '""')}"`;
