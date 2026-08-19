import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupDrill } from '#ui/components/Table/Table.types';

import { resolveGroupToggleAction } from './resolveGroupToggleAction.util';

const PAGE = [{ id: 1 }];

const drillOf = (status: TableGroupDrill['status']): TableGroupDrill => ({
  rows: status === 'loaded' ? PAGE : [],
  status,
});

describe('resolveGroupToggleAction', () => {
  it('fetches on the first gesture, rather than collapsing an untouched leaf', () => {
    // Expansion is held by its complement (ADR-067), so an untouched group is
    // *expanded* — a plain toggle would collapse it and hide nothing, which is
    // the opposite of what clicking a leaf asks for.
    expect(
      resolveGroupToggleAction({
        drill: undefined,
        isCollapsed: false,
        isDrillable: true,
      }),
    ).toBe('drill');
  });

  it('folds a drilled group away rather than re-fetching it', () => {
    // `loaded` is terminal (ADR-079); a collapse must not un-terminate it.
    expect(
      resolveGroupToggleAction({
        drill: drillOf('loaded'),
        isCollapsed: false,
        isDrillable: true,
      }),
    ).toBe('toggle');
  });

  it('brings a folded drill back with no second request', () => {
    expect(
      resolveGroupToggleAction({
        drill: drillOf('loaded'),
        isCollapsed: true,
        isDrillable: true,
      }),
    ).toBe('toggle');
  });

  it('does not fire a second request while one is in flight', () => {
    expect(
      resolveGroupToggleAction({
        drill: drillOf('loading'),
        isCollapsed: false,
        isDrillable: true,
      }),
    ).toBe('toggle');
  });

  it('retries a failed drill when the group is reopened', () => {
    // The one deliberate gesture that leaves `failed` — nothing retries on the
    // user's behalf (ADR-079, amended).
    expect(
      resolveGroupToggleAction({
        drill: drillOf('failed'),
        isCollapsed: true,
        isDrillable: true,
      }),
    ).toBe('drill');
  });

  it('folds a failed drill away without retrying it', () => {
    // Closing is how the user reaches the reopen that retries; retrying on the
    // way out would fire a request nobody asked for and hide its result.
    expect(
      resolveGroupToggleAction({
        drill: drillOf('failed'),
        isCollapsed: false,
        isDrillable: true,
      }),
    ).toBe('toggle');
  });

  it('leaves a row that cannot drill to the plain toggle', () => {
    expect(
      resolveGroupToggleAction({
        drill: undefined,
        isCollapsed: false,
        isDrillable: false,
      }),
    ).toBe('toggle');
  });
});
