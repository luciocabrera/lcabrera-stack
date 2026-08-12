/**
 * Did the #450 fixes actually make anything faster?
 *
 * #450 deleted a provably no-op `.filter()` from both `unpin-beyond` branches of
 * `resolveAcceptedUnpinConflictState`, and made `resolvePinConflictState` reuse
 * the `allOrderedKeys` projection it already computed. Both were argued from
 * redundancy, and the first also removed an `O(window x pinned)` `Array.includes`
 * scan — a claim worth confirming rather than asserting, since a refactor that
 * "removes a pass" can easily measure as a wash. Issue #454.
 *
 * The pre-fix implementations are transcribed here from the diff; each is marked.
 * Read absolute per-call cost first — see ./ARCHITECTURE.md.
 */

import { bench, describe } from 'vite-plus/test';

import type {
  ColumnOrderState,
  ColumnPinningState,
  TableColumn,
} from '#ui/components/Table/Table.types';

type Row = Record<string, unknown>;

/** 150 is the real ceiling; the rest locate the O(n*m) term's onset. */
const SIZES = [10, 30, 150, 1000] as const;

/** Fraction of columns pinned — drives the removed `includes` scan's cost. */
const PINNED_RATIO = 0.2;

const sink = { total: 0 };

const buildColumns = (size: number): readonly TableColumn<Row>[] =>
  Array.from({ length: size }, (_, index) => ({
    key: `col_${index}`,
    label: `Column ${index}`,
  })) as readonly TableColumn<Row>[];

for (const size of SIZES) {
  const columns = buildColumns(size);
  const pinnedCount = Math.max(1, Math.floor(size * PINNED_RATIO));
  const pinnedKeys = columns.slice(0, pinnedCount).map((column) => column.key);
  const index = Math.floor(size / 2);

  // ---- resolveAcceptedUnpinConflictState, `unpin-beyond` left branch -------
  describe(`unpin-beyond left branch (n=${size}, pinned=${pinnedCount})`, () => {
    bench('before #450: map().filter(left.includes) -> Set', () => {
      const left = [...pinnedKeys];
      const keysToUnpin = new Set(
        columns
          .slice(index)
          .map((column) => column.key)
          .filter((key) => left.includes(key)),
      );
      sink.total += left.filter((key) => !keysToUnpin.has(key)).length;
    });

    bench('after #450: map() -> Set', () => {
      const left = [...pinnedKeys];
      const keysFromIndex = new Set(
        columns.slice(index).map((column) => column.key),
      );
      sink.total += left.filter((key) => !keysFromIndex.has(key)).length;
    });
  });

  // ---- resolvePinConflictState, `move-column` branch -----------------------
  describe(`move-column order rebuild (n=${size})`, () => {
    const columnKey = `col_${index}`;

    bench('before #450: re-derive with filter().map()', () => {
      const allOrderedKeys = columns.map((column) => column.key);
      const newOrder: ColumnOrderState<Row> = columns
        .filter((column) => column.key !== columnKey)
        .map((column) => column.key);
      sink.total += newOrder.length + allOrderedKeys.length;
    });

    bench('after #450: reuse allOrderedKeys, filter() only', () => {
      const allOrderedKeys = columns.map((column) => column.key);
      const newOrder: ColumnOrderState<Row> = allOrderedKeys.filter(
        (key) => key !== columnKey,
      );
      sink.total += newOrder.length + allOrderedKeys.length;
    });
  });

  // ---- The still-accepted `reorder-to-fill` chain in the same file ---------
  // Not changed by #450: no precomputed key array exists in that function, so
  // fusing needs an accumulator. Measured to check that acceptance.
  describe(`reorder-to-fill order rebuild (n=${size})`, () => {
    const columnKey = `col_${index}`;
    const pinning: ColumnPinningState<Row> = {
      left: pinnedKeys,
      right: [],
    };

    bench('current: filter().map()', () => {
      sink.total += columns
        .filter((column) => column.key !== columnKey)
        .map((column) => column.key).length;
      sink.total += pinning.left.length;
    });

    bench('fused: reduce()+push', () => {
      sink.total += columns.reduce<string[]>((keys, column) => {
        if (column.key !== columnKey) keys.push(column.key);

        return keys;
      }, []).length;
      sink.total += pinning.left.length;
    });
  });
}

if (sink.total < 0)
  throw new Error('unreachable: sink guards dead-code elimination');
