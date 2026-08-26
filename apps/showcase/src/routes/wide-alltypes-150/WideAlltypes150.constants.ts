import type { TableColumn } from '@lcabrera/ui/components/Table/Table.types';

import type { WideAlltypes150 } from '@/services';

export const PERSISTENCE_KEY = 'wide-alltypes-150-table';
export const SCHEMA_NAME = 'public';
export const TABLE_NAME = 'wide_alltypes_150';
export const TITLE = {
  plural: 'Wide All-Types — 150 Columns × 1M Rows',
  singular: 'Row',
};

// fallow-ignore-next-line complexity -- temporary testing suppression
const getColDataType = (index: number) => {
  const mod = index % 20;
  if (mod === 6) return 'boolean';
  if (mod === 9) return 'date';
  if ([0, 1, 4, 5].includes(mod)) return 'number';
  return 'string';
};

const PG_TYPE_LABELS: Readonly<Record<number, string>> = {
  0: 'Smallint',
  1: 'Integer',
  2: 'Bigint',
  3: 'Numeric',
  4: 'Real',
  5: 'Double',
  6: 'Boolean',
  7: 'Varchar',
  8: 'Text',
  9: 'Date',
  10: 'Time',
  11: 'Timestamp',
  12: 'Timestamptz',
  13: 'UUID',
  14: 'JSONB',
  15: 'Bytea',
  16: 'Inet',
  17: 'Interval',
  18: 'Point',
  19: 'Int[]',
};

// ─── Column definitions ───────────────────────────────────────────────────────

const ID_COLUMN: TableColumn<WideAlltypes150> = {
  dataType: 'number',
  isPrimaryKey: true,
  key: 'id',
  label: 'ID',
  minWidth: 80,
};

type BuildGeneratedColumnArgs = {
  readonly index: number;
};

const buildGeneratedColumn = ({ index }: BuildGeneratedColumnArgs) => {
  const mod = index % 20;
  const key = `c_${String(index).padStart(3, '0')}` as keyof WideAlltypes150;
  const typeLabel = PG_TYPE_LABELS[mod] ?? 'Col';
  const isFilterable = mod !== 15 && mod !== 18 && mod !== 19;

  return {
    dataType: getColDataType(index),
    isFilterable,
    isSortable: mod !== 19, // integer[] columns are not meaningfully sortable
    key,
    label: `${typeLabel} ${index}`,
    minWidth: 130,
  } satisfies TableColumn<WideAlltypes150>;
};

const GENERATED_COLUMNS: TableColumn<WideAlltypes150>[] = Array.from(
  { length: 149 },
  (_, zeroBasedIndex) => buildGeneratedColumn({ index: zeroBasedIndex + 1 }),
);

export const COLUMNS: TableColumn<WideAlltypes150>[] = [
  ID_COLUMN,
  ...GENERATED_COLUMNS,
];
