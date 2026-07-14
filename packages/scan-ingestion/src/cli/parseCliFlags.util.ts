type CliFlags = Record<string, string>;

/**
 * Parses `--key=value` CLI flags from an argv slice into a record (later
 * duplicates win). Shared by the scan-ingestion node CLIs (ingest, push).
 * Everything that isn't a `--key=value` token is ignored.
 */
export const parseCliFlags = (argv: readonly string[]): CliFlags => {
  const result: CliFlags = {};

  for (const arg of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(arg);
    if (match?.[1] && match[2] !== undefined) {
      result[match[1]] = match[2];
    }
  }

  return result;
};
