type ExtractGenericDetailRowsArgs = {
  readonly rawJson: unknown;
};

/**
 * Detail rows for a registry-added scanner without a bespoke extractor
 * (ADR-023), fed to sp_ingest_generic_detail. Contract (documented in the
 * scaffolded runner): the raw artifact SHOULD carry its per-row data under
 * a top-level `rows` array; a bare array is taken as the rows themselves;
 * anything else degrades to a single whole-artifact row so no data is
 * silently dropped.
 */
export const extractGenericDetailRows = ({
  rawJson,
}: ExtractGenericDetailRowsArgs): readonly unknown[] => {
  if (Array.isArray(rawJson)) {
    return rawJson;
  }
  if (typeof rawJson === 'object' && rawJson !== null && 'rows' in rawJson) {
    const { rows } = rawJson as { readonly rows: unknown };
    if (Array.isArray(rows)) {
      return rows;
    }
  }
  return [rawJson];
};
