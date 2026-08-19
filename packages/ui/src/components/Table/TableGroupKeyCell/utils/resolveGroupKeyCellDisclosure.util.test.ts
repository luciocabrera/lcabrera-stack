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
  isDrillable: false,
  isExpanded: false,
  levelDisclosures: [],
  ...overrides,
});

describe('resolveGroupKeyCellDisclosure', () => {
  it('draws nothing where the row has neither a fold nor a drill', () => {
    expect(
      resolveGroupKeyCellDisclosure({
        columnKey: 'city',
        disclosure: stateOf(),
        isInnermost: false,
        path: MARAIS,
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
      isInnermost: false,
      path: MARAIS,
    });

    // The ancestor's path, not the row's: folding `Paris` from a row inside it
    // must not fold that row's own group instead.
    expect(resolved?.path).toStrictEqual(PARIS);
    expect(resolved?.disclosure?.isExpanded).toBe(true);
    expect(resolved?.disclosure?.isDrillable).toBe(false);
  });

  it('answers a drill from the row’s own innermost level', () => {
    const disclosure = stateOf({ isDrillable: true, isExpanded: true });
    const resolved = resolveGroupKeyCellDisclosure({
      columnKey: 'district',
      disclosure,
      isInnermost: true,
      path: MARAIS,
    });

    expect(resolved?.path).toStrictEqual(MARAIS);
    expect(resolved?.disclosure).toBe(disclosure);
  });

  it('prefers the drill’s own state on a leaf that is both', () => {
    // A drilled leaf owns loaded children *and* is drillable. The drill reports
    // a group as open from the moment the fetch starts rather than when its
    // rows arrive (ADR-079), so a fold derived from the collapsed set alone
    // would call it shut while its spinner shows.
    const resolved = resolveGroupKeyCellDisclosure({
      columnKey: 'district',
      disclosure: stateOf({
        isDrillable: true,
        isExpanded: true,
        levelDisclosures: [
          { columnKey: 'district', isExpanded: false, path: MARAIS },
        ],
      }),
      isInnermost: true,
      path: MARAIS,
    });

    expect(resolved?.disclosure?.isExpanded).toBe(true);
    expect(resolved?.disclosure?.isDrillable).toBe(true);
  });

  it('ignores a drill on a column that is not the row’s innermost', () => {
    expect(
      resolveGroupKeyCellDisclosure({
        columnKey: 'city',
        disclosure: stateOf({ isDrillable: true }),
        isInnermost: false,
        path: MARAIS,
      }),
    ).toBeUndefined();
  });
});
