import type { TableColumn } from '#ui/components/Table';

export type JsonExplorerProps = {
  readonly sections: readonly JsonExplorerSection[];
};

export type JsonExplorerSection = {
  readonly columns: readonly TableColumn<Record<string, unknown>>[];
  readonly label: string;
  readonly rows: readonly Record<string, unknown>[];
};
