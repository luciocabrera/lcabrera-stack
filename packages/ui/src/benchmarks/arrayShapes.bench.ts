/**
 * Real-function counterpart to `scripts/bench-array-operations.mjs` (ADR-054).
 *
 * The synthetic benchmark ranks the SHAPES; this ranks the actual call sites, so
 * the eight findings accepted in `docs/agents/react-doctor-triage.md` rest on a
 * measurement of the code that ships rather than on a proxy. Issue #454.
 *
 * Read absolute per-call cost first, ratios second — see ./ARCHITECTURE.md.
 */

import { bench, describe } from 'vite-plus/test';

import type {
  ColumnSizingState,
  DataKey,
  SortingState,
  TableColumn,
} from '#ui/components/Table/Table.types';

import { appendPrimaryKeySorting } from '#ui/routing/shared/appendPrimaryKeySorting.util';

import { buildPresetColumnSizing } from '../components/Table/TableSettingsDrawer/GeneralSettingsSection/utils/buildPresetColumnSizing.util';
import { getStaticColumnKeys } from '../components/Table/utils/getStaticColumnKeys.util';
import { resolvePrimaryKeyColumnKeys } from '../components/Table/utils/resolvePrimaryKeyColumnKeys.util';

type Row = Record<string, unknown>;

/**
 * The realistic ceiling is 150 — the deliberate `wide-alltypes-150` stress
 * route. 1_000 and 10_000 are included only to locate a crossover, not because
 * any UI path reaches them.
 */
const SIZES = [10, 30, 150, 1000, 10_000] as const;

/** Consumed so V8 cannot delete the allocation under test. */
const sink = { total: 0 };

const buildColumns = (size: number): readonly TableColumn<Row>[] =>
  Array.from({ length: size }, (_, index) => ({
    dataType: 'string' as const,
    isFilterable: index % 7 !== 0,
    isPrimaryKey: index === 0,
    isSortable: index % 5 !== 0,
    isStatic: index % 11 === 0,
    key: `col_${index}`,
    label: `Column ${index}`,
    maxWidth: index % 3 === 0 ? 320 : undefined,
    minWidth: index % 3 === 0 ? 80 : undefined,
  })) as readonly TableColumn<Row>[];

for (const size of SIZES) {
  const columns = buildColumns(size);

  // ---- resolvePrimaryKeyColumnKeys — filter().map(), keeps 1 of `size` ------
  describe(`resolvePrimaryKeyColumnKeys (n=${size})`, () => {
    bench('current: filter().map()', () => {
      sink.total += resolvePrimaryKeyColumnKeys({ columns }).length;
    });

    bench('fused: reduce()+push', () => {
      sink.total += columns.reduce<DataKey<Row>[]>((keys, column) => {
        if (column.isPrimaryKey === true && column.key !== 'actions') {
          keys.push(column.key);
        }

        return keys;
      }, []).length;
    });

    bench('fused: flatMap() wrapping', () => {
      sink.total += columns.flatMap((column) =>
        column.isPrimaryKey === true && column.key !== 'actions'
          ? [column.key]
          : [],
      ).length;
    });
  });

  // ---- getStaticColumnKeys — filter().map() feeding new Set() --------------
  describe(`getStaticColumnKeys (n=${size})`, () => {
    bench('current: filter().map() -> Set', () => {
      sink.total += getStaticColumnKeys(columns).size;
    });

    bench('fused: for...of + set.add', () => {
      const keys = new Set<string>();
      for (const column of columns) if (column.isStatic) keys.add(column.key);
      sink.total += keys.size;
    });
  });

  // ---- buildPresetColumnSizing — map(as const).filter() -> fromEntries -----
  describe(`buildPresetColumnSizing (n=${size})`, () => {
    bench('current: map().filter() -> fromEntries', () => {
      sink.total += Object.keys(
        buildPresetColumnSizing({ columns, preset: 'max' }),
      ).length;
    });

    bench('fused: reduce() into an object', () => {
      const sizing = columns.reduce<Record<string, number>>((acc, column) => {
        const width = column.maxWidth;
        if (width) acc[column.key] = width;

        return acc;
      }, {}) as ColumnSizingState<Row>;
      sink.total += Object.keys(sizing).length;
    });
  });

  // ---- AddSortSection options — filter(nested every).map() -----------------
  // Transcribed from AddSortSection.component.tsx: the expression is inline in
  // the component, so it cannot be imported. The nested `sorting.every` is the
  // point — it makes the filter O(columns x sorting), which is the term the
  // react-doctor suggestion does not touch.
  const sorting: SortingState<Row> = Array.from(
    { length: Math.min(5, size) },
    (_, index) => ({ columnKey: `col_${index}`, direction: 'asc' as const }),
  );

  describe(`AddSortSection options (n=${size}, sorting=${sorting.length})`, () => {
    bench('current: filter(every).map()', () => {
      sink.total += columns
        .filter(
          (col) =>
            col.isSortable !== false &&
            sorting.every((s) => s.columnKey !== col.key),
        )
        .map((col) => ({ label: col.label, value: col.key })).length;
    });

    bench('fused: reduce()+push', () => {
      sink.total += columns.reduce<{ label: string; value: string }[]>(
        (options, col) => {
          if (
            col.isSortable !== false &&
            sorting.every((s) => s.columnKey !== col.key)
          ) {
            options.push({ label: col.label, value: col.key });
          }

          return options;
        },
        [],
      ).length;
    });

    bench('alternative: Set of sorted keys + filter().map()', () => {
      const sortedKeys = new Set(sorting.map((s) => s.columnKey));
      sink.total += columns
        .filter((col) => col.isSortable !== false && !sortedKeys.has(col.key))
        .map((col) => ({ label: col.label, value: col.key })).length;
    });
  });

  // ---- useAddFilterSection options — filter().map() with Object.hasOwn -----
  // Transcribed from useAddFilterSection.hook.ts for the same reason.
  const activeFilters: Record<string, unknown> = Object.fromEntries(
    Array.from({ length: Math.min(3, size) }, (_, i) => [`col_${i}`, {}]),
  );

  describe(`useAddFilterSection options (n=${size})`, () => {
    bench('current: filter().map()', () => {
      sink.total += columns
        .filter((col) => col.isFilterable !== false)
        .map((col) => {
          const hasActiveFilter = Object.hasOwn(activeFilters, col.key);

          return {
            label: hasActiveFilter ? `${col.label} (filtered)` : col.label,
            value: col.key,
          };
        }).length;
    });

    bench('fused: reduce()+push', () => {
      sink.total += columns.reduce<{ label: string; value: string }[]>(
        (options, col) => {
          if (col.isFilterable !== false) {
            const hasActiveFilter = Object.hasOwn(activeFilters, col.key);
            options.push({
              label: hasActiveFilter ? `${col.label} (filtered)` : col.label,
              value: col.key,
            });
          }

          return options;
        },
        [],
      ).length;
    });
  });

  // ---- appendPrimaryKeySorting — filter().map() over the PK list (n=1) -----
  describe(`appendPrimaryKeySorting (n=${size} cols, 1 pk)`, () => {
    bench('current: filter().map()', () => {
      sink.total += appendPrimaryKeySorting({ columns, sorting }).length;
    });
  });
}

// ---- NotificationCenter placements — map().filter() over a fixed 4 ---------
// Transcribed from NotificationCenter.component.tsx. Size is a hard-coded
// constant, so this runs once rather than per SIZES entry.
describe('NotificationCenter placements (n=4, fixed)', () => {
  const PLACEMENTS = [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ] as const;
  const byPlacement: Record<string, readonly { id: string }[]> = {
    'bottom-left': [],
    'bottom-right': [{ id: 'c' }],
    'top-left': [{ id: 'a' }, { id: 'b' }],
    'top-right': [],
  };

  bench('current: map().filter()', () => {
    sink.total += PLACEMENTS.map((placement) => ({
      placement,
      placementNotifications: byPlacement[placement] ?? [],
    })).filter(
      ({ placementNotifications }) => placementNotifications.length > 0,
    ).length;
  });

  bench('fused: reduce()+push', () => {
    sink.total += PLACEMENTS.reduce<
      { placement: string; placementNotifications: readonly { id: string }[] }[]
    >((acc, placement) => {
      const placementNotifications = byPlacement[placement] ?? [];
      if (placementNotifications.length > 0) {
        acc.push({ placement, placementNotifications });
      }

      return acc;
    }, []).length;
  });
});

if (sink.total < 0)
  throw new Error('unreachable: sink guards dead-code elimination');
