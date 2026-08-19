import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupDrill } from '#ui/components/Table/Table.types';

import { resolveGroupRowIsExpanded } from './resolveGroupRowIsExpanded.util';

const LOADED: TableGroupDrill = { rows: [{ id: 1 }], status: 'loaded' };

describe('resolveGroupRowIsExpanded', () => {
  it('reads an ordinary group row off the collapsed set alone', () => {
    // Expansion is held by its complement (ADR-067).
    expect(
      resolveGroupRowIsExpanded({
        drill: undefined,
        isCollapsed: false,
        isDrillable: false,
        pathKey: 'region:Iberia',
      }),
    ).toBe(true);
  });

  it('reports an untouched drillable leaf as not expanded', () => {
    // It is not in the collapsed set — nothing is, until a user acts — so
    // membership alone would report every leaf open with nothing under it.
    expect(
      resolveGroupRowIsExpanded({
        drill: undefined,
        isCollapsed: false,
        isDrillable: true,
        pathKey: 'region:Iberia',
      }),
    ).toBe(false);
  });

  it('reports a drilled leaf as expanded', () => {
    expect(
      resolveGroupRowIsExpanded({
        drill: LOADED,
        isCollapsed: false,
        isDrillable: true,
        pathKey: 'region:Iberia',
      }),
    ).toBe(true);
  });

  it('reports a folded drill as not expanded, entry or no entry', () => {
    expect(
      resolveGroupRowIsExpanded({
        drill: LOADED,
        isCollapsed: true,
        isDrillable: true,
        pathKey: 'region:Iberia',
      }),
    ).toBe(false);
  });

  it('reports a detail row as not expanded', () => {
    // No path key means the row is not a group at all.
    expect(
      resolveGroupRowIsExpanded({
        drill: undefined,
        isCollapsed: false,
        isDrillable: false,
        pathKey: undefined,
      }),
    ).toBe(false);
  });
});
