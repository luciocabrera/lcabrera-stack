import { describe, expect, it } from 'vite-plus/test';

import type { TableMetaState } from '#ui/components/Table/Table.types';

import { resolveTableCapabilityMeta } from './resolveTableCapabilityMeta.util';

describe('resolveTableCapabilityMeta', () => {
  it('resolves every capability off when no meta is given', () => {
    expect(resolveTableCapabilityMeta({})).toStrictEqual({
      isGroupDrillEnabled: false,
      isGroupingEnabled: false,
      isGroupingLocked: false,
      isKeysetEnabled: false,
      isServerFilterEnabled: false,
    });
  });

  it('resolves every capability off when the meta declares none', () => {
    expect(
      resolveTableCapabilityMeta({
        meta: { title: { plural: '', singular: '' } },
      }),
    ).toStrictEqual({
      isGroupDrillEnabled: false,
      isGroupingEnabled: false,
      isGroupingLocked: false,
      isKeysetEnabled: false,
      isServerFilterEnabled: false,
    });
  });

  it('carries each declared capability through', () => {
    expect(
      resolveTableCapabilityMeta({
        meta: {
          isGroupDrillEnabled: true,
          isGroupingEnabled: true,
          isGroupingLocked: true,
          isKeysetEnabled: true,
          isServerFilterEnabled: true,
        },
      }),
    ).toStrictEqual({
      isGroupDrillEnabled: true,
      isGroupingEnabled: true,
      isGroupingLocked: true,
      isKeysetEnabled: true,
      isServerFilterEnabled: true,
    });
  });

  it('resolves each capability independently', () => {
    expect(
      resolveTableCapabilityMeta({ meta: { isServerFilterEnabled: true } }),
    ).toStrictEqual({
      isGroupDrillEnabled: false,
      isGroupingEnabled: false,
      isGroupingLocked: false,
      isKeysetEnabled: false,
      isServerFilterEnabled: true,
    });
  });

  it('resolves grouping on from the flag alone', () => {
    expect(
      resolveTableCapabilityMeta({ meta: { isGroupingEnabled: true } }),
    ).toStrictEqual({
      isGroupDrillEnabled: false,
      isGroupingEnabled: true,
      isGroupingLocked: false,
      isKeysetEnabled: false,
      isServerFilterEnabled: false,
    });
  });

  it('returns every capability key even when the meta is empty', () => {
    // The result is spread over cookie-derived meta, so a missing key would
    // leave whatever the cookie put there rather than overriding it off.
    expect(
      Object.keys(resolveTableCapabilityMeta({})).toSorted((a, b) =>
        a.localeCompare(b),
      ),
    ).toEqual([
      'isGroupDrillEnabled',
      'isGroupingEnabled',
      'isGroupingLocked',
      'isKeysetEnabled',
      'isServerFilterEnabled',
    ]);
  });

  it('treats a non-boolean cookie-shaped value as off', () => {
    // Parsed rather than written as a literal, because that is how such a value
    // actually arrives: the persisted payload is cast, not validated, so a
    // capability key can reach here holding anything at all.
    const cookieShapedMeta = JSON.parse(
      '{"isKeysetEnabled":"yes","isGroupingEnabled":1}',
    ) as Partial<TableMetaState>;

    expect(
      resolveTableCapabilityMeta({ meta: cookieShapedMeta }),
    ).toStrictEqual({
      isGroupDrillEnabled: false,
      isGroupingEnabled: false,
      isGroupingLocked: false,
      isKeysetEnabled: false,
      isServerFilterEnabled: false,
    });
  });
});
