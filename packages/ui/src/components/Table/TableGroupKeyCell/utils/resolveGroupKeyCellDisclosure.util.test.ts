import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';
import type { TableGroupDisclosureState } from '#ui/components/Table/TableGroupDisclosure';

import { resolveGroupKeyCellDisclosure } from './resolveGroupKeyCellDisclosure.util';

const PARIS: readonly TableGroupKeyValue[] = [
  { columnKey: 'city', label: 'Paris', value: 'Paris' },
];
const MARAIS: readonly TableGroupKeyValue[] = [
  ...PARIS,
  { columnKey: 'district', label: 'Marais', value: 'Marais' },
];

const stateOf = (
  overrides: Partial<TableGroupDisclosureState> = {},
): TableGroupDisclosureState => ({
  hasChildren: false,
  isExpanded: false,
  levelDisclosures: [],
  ...overrides,
});

describe('resolveGroupKeyCellDisclosure', () => {
  it('draws nothing where this column names no foldable level', () => {
    expect(
      resolveGroupKeyCellDisclosure({
        columnKey: 'city',
        disclosure: stateOf(),
      }),
    ).toBeUndefined();
  });

  it('folds the level its own column holds, naming that level’s path', () => {
    const resolved = resolveGroupKeyCellDisclosure({
      columnKey: 'city',
      disclosure: stateOf({
        levelDisclosures: [
          { columnKey: 'city', isExpanded: true, path: PARIS },
        ],
      }),
    });

    // The ancestor's path, not the row's: folding `Paris` from a row inside it
    // must not fold that row's own group instead.
    expect(resolved?.path).toStrictEqual(PARIS);
    expect(resolved?.disclosure?.isExpanded).toBe(true);
  });

  it('draws nothing for a column naming a level this row cannot fold', () => {
    // The row's own innermost level is the level it *is*, so it has nothing
    // under it to fold — its rows open in their own route instead (#870).
    expect(
      resolveGroupKeyCellDisclosure({
        columnKey: 'district',
        disclosure: stateOf({
          levelDisclosures: [
            { columnKey: 'city', isExpanded: true, path: PARIS },
          ],
        }),
      }),
    ).toBeUndefined();
  });

  it('rebuilds the disclosure from the level rather than passing the row’s', () => {
    // The row's own state answers for the row; this cell draws the ancestor its
    // column names, which is open or shut independently of it.
    const resolved = resolveGroupKeyCellDisclosure({
      columnKey: 'city',
      disclosure: stateOf({
        isExpanded: false,
        levelDisclosures: [
          { columnKey: 'city', isExpanded: true, path: MARAIS },
        ],
      }),
    });

    expect(resolved?.disclosure).toStrictEqual({
      hasChildren: true,
      isExpanded: true,
      levelDisclosures: [],
    });
  });
});
