import type { JsonExplorerSection } from '@lcabrera/ui/components/JsonExplorer';

import { inferTableColumnsFromJson } from '@lcabrera/ui/components/Table/utils/inferTableColumnsFromJson.util';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isArrayOfRecords = (
  value: unknown,
): value is readonly Record<string, unknown>[] =>
  Array.isArray(value) && value.every(isRecord);

/**
 * Walks a scan's raw_json artifact into `JsonExplorer` sections: one
 * section per top-level key whose value is an array of objects (e.g.
 * linter's `raw_json.oxlint.diagnostics`/`raw_json.eslint`), plus a "root"
 * section if raw_json itself is such an array. Column inference happens
 * here (server-side, in the loader) via `inferTableColumnsFromJson` —
 * never client-side, per that util's own contract.
 */
export const buildJsonExplorerSections = (
  rawJson: unknown,
): readonly JsonExplorerSection[] => {
  if (isArrayOfRecords(rawJson)) {
    return [
      {
        columns: inferTableColumnsFromJson({ rows: rawJson }),
        label: 'root',
        rows: rawJson,
      },
    ];
  }

  if (!isRecord(rawJson)) {
    return [];
  }

  const sections: JsonExplorerSection[] = [];

  for (const [key, value] of Object.entries(rawJson)) {
    if (isArrayOfRecords(value)) {
      sections.push({
        columns: inferTableColumnsFromJson({ rows: value }),
        label: key,
        rows: value,
      });
    } else if (isRecord(value) && isArrayOfRecords(value.diagnostics)) {
      // oxlint's own shape nests its array one level deeper.
      sections.push({
        columns: inferTableColumnsFromJson({ rows: value.diagnostics }),
        label: `${key}.diagnostics`,
        rows: value.diagnostics,
      });
    }
  }

  return sections;
};
