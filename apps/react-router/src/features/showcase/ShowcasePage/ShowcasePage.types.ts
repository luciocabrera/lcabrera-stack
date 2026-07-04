import type { TableColumnDataType } from '@repo/ui/components/Table/Table.types';

export type GenerateCellValueArgs = {
  readonly colIdx: number;
  readonly dataType: TableColumnDataType | undefined;
  readonly rowIdx: number;
};

export type MockResponse = {
  readonly data: MockRow[];
  readonly total: number;
};

export type MockRow = Record<string, boolean | number | string>;
