import type { TableColumn } from '@repo/ui/components/Table/Table.types';

import {
  getInitialColumnsState,
  getInitialMetaState,
} from '@repo/ui/components/Table/contexts/TableConfig/utils';
import { readPersistedUiStateFromSessionStorage } from '@repo/ui/components/Table/utils';

import type {
  GenerateCellValueArgs,
  MockResponse,
  MockRow,
} from './ShowcasePage.types';

// --- Seeded RNG (deterministic pseudo-random for consistent test data) ---
const mulberry32 = (seed: number) => {
  let value = seed;
  return () => {
    value = Math.trunc(value);
    // oxlint-disable-next-line unicorn/number-literal-case -- formatter lowercases hex digits
    value = Math.trunc(value + 0x6d_2b_79_f5);
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return Math.trunc(t ^ (t >>> 14)) / 4_294_967_296;
  };
};

const rng = mulberry32(123_456_789);

// --- Table columns & data ---

const COLUMNS: TableColumn<MockRow>[] = Array.from({ length: 20 }, (_, i) => ({
  dataType: (['number', 'string', 'boolean', 'date', 'currency'] as const)[
    i % 5
  ],
  key: `col${i + 1}`,
  label: `Column ${i + 1}`,
  minWidth: 120,
}));

const randomCurrency = () => (rng() * 10_000).toFixed(2);

const randomDate = () => {
  const start = new Date(2010, 0, 1).getTime();
  const end = new Date(2030, 0, 1).getTime();
  return new Date(start + rng() * (end - start));
};

const randomString = (length: number) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from(
    { length },
    () => chars[Math.floor(rng() * chars.length)],
  ).join('');
};

// fallow-ignore-next-line complexity -- showcase-only data generator
const generateCellValue = ({
  colIdx,
  dataType,
  rowIdx,
}: GenerateCellValueArgs): boolean | number | string => {
  if (dataType === 'boolean') return rng() > 0.5;
  if (dataType === 'currency') return `$${randomCurrency()}`;
  if (dataType === 'date') return randomDate().toISOString().slice(0, 10);
  if (dataType === 'number') return rowIdx * colIdx;
  if (dataType === 'string') return randomString(8);
  return '';
};

const tableData: MockRow[] = Array.from({ length: 10_000 }, (_, rowIdx) =>
  Object.fromEntries(
    COLUMNS.map((col, colIdx) => [
      col.key,
      generateCellValue({ colIdx, dataType: col.dataType, rowIdx }),
    ]),
  ),
);

// --- Table config ---

/** Simulated API delay in milliseconds. Adjust to test loading states. */
export const FAKE_API_DELAY_MS = 2000;

const PERSISTENCE_KEY = 'app-showcase-table';

export const SHOWCASE_COLUMNS_STATE = getInitialColumnsState({
  columns: COLUMNS,
  persistenceKey: PERSISTENCE_KEY,
});

export const SHOWCASE_META_STATE = getInitialMetaState({
  persistedUiState: readPersistedUiStateFromSessionStorage({
    persistenceKey: PERSISTENCE_KEY,
  }),
  persistenceKey: PERSISTENCE_KEY,
  title: 'Data Table',
});

const fetchTableData = (): Promise<MockResponse> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: tableData, total: tableData.length });
    }, FAKE_API_DELAY_MS);
  });

// Created once at module level to avoid refetching on re-renders
const tableDataPromiseCache: { current: Promise<MockResponse> | undefined } = {
  current: undefined,
};

export const getTableDataPromise = () => {
  tableDataPromiseCache.current ??= fetchTableData();
  return tableDataPromiseCache.current;
};

export const resetTableDataPromise = (): void => {
  tableDataPromiseCache.current = undefined;
};

// --- VirtualSelect config ---

export const STATIC_FRUITS = [
  'Apple',
  'Banana',
  'Cherry',
  'Date',
  'Elderberry',
  'Fig',
  'Grape',
  'Honeydew',
  'Kiwi',
  'Lemon',
  'Mango',
  'Nectarine',
  'Orange',
  'Papaya',
  'Quince',
  'Raspberry',
  'Strawberry',
  'Tangerine',
  'Watermelon',
] as const;

export const LARGE_DATASET = Array.from(
  { length: 5000 },
  (_, i) => `City_${String(i + 1).padStart(5, '0')}`,
);

export const FETCH_PAGE_SIZE = 50;
export const FETCH_DELAY_MS = 800;
