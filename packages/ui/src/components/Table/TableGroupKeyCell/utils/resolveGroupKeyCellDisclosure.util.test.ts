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

    expect(resolved?.path).toStrictEqual(PARIS);
    expect(resolved?.disclosure?.isExpanded).toBe(true);
  });

  it('draws nothing for a column naming a level this row cannot fold', () => {
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
