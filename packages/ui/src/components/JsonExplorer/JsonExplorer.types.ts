import type { TableColumn } from '@repo/ui/components/Table';

export type JsonExplorerSection = {
  readonly columns: readonly TableColumn<Record<string, unknown>>[];
  readonly label: string;
  readonly rows: readonly Record<string, unknown>[];
};

export type JsonExplorerProps = {
  /** Pre-shaped server-side (a loader calls `inferTableColumnsFromJson` — see its own doc for why this must not happen client-side). */
  readonly sections: readonly JsonExplorerSection[];
};
