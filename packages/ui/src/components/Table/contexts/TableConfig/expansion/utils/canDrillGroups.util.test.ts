import { describe, expect, it } from 'vite-plus/test';

import { canDrillGroups } from './canDrillGroups.util';

const fetcher = async () => [];

describe('canDrillGroups', () => {
  it('needs both the capability and the fetcher', () => {
    expect(
      canDrillGroups({
        isGroupDrillEnabled: true,
        onDrillGroup: fetcher,
      }),
    ).toBe(true);
  });

  it('refuses the capability without a fetcher to reach the endpoint', () => {
    // The failure this exists to prevent: every leaf marked drillable, with a
    // chevron, an `aria-expanded` and a keyboard gesture, and every use of it
    // finding no fetcher and returning. An inert announced control is worse
    // than one that was never offered.
    expect(
      canDrillGroups({
        isGroupDrillEnabled: true,
        onDrillGroup: undefined,
      }),
    ).toBe(false);
  });

  it('refuses a fetcher the route never declared an endpoint for', () => {
    expect(
      canDrillGroups({
        isGroupDrillEnabled: false,
        onDrillGroup: fetcher,
      }),
    ).toBe(false);
  });

  it('treats an absent capability as off', () => {
    // A route declaring no capability meta must send exactly what one declaring
    // `false` sends (ADR-063).
    expect(
      canDrillGroups({
        isGroupDrillEnabled: undefined,
        onDrillGroup: fetcher,
      }),
    ).toBe(false);
  });
});
