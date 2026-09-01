import { describe, expect, it } from 'vite-plus/test';

import type { TableMetaState } from '#ui/components/Table/Table.types';

import { resolveTableCapabilityMeta } from './resolveTableCapabilityMeta.util';

describe('resolveTableCapabilityMeta', () => {
  it('resolves every capability off when no meta is given', () => {
    expect(resolveTableCapabilityMeta({})).toStrictEqual({
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
          isGroupingEnabled: true,
          isGroupingLocked: true,
          isKeysetEnabled: true,
          isServerFilterEnabled: true,
        },
      }),
    ).toStrictEqual({
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
      isGroupingEnabled: true,
      isGroupingLocked: false,
      isKeysetEnabled: false,
      isServerFilterEnabled: false,
    });
  });

  it('returns every capability key even when the meta is empty', () => {
    expect(
      Object.keys(resolveTableCapabilityMeta({})).toSorted((a, b) =>
        a.localeCompare(b),
      ),
    ).toEqual([
      'isGroupingEnabled',
      'isGroupingLocked',
      'isKeysetEnabled',
      'isServerFilterEnabled',
    ]);
  });

  it('treats a non-boolean cookie-shaped value as off', () => {
    const cookieShapedMeta = JSON.parse(
      '{"isKeysetEnabled":"yes","isGroupingEnabled":1}',
    ) as Partial<TableMetaState>;

    expect(
      resolveTableCapabilityMeta({ meta: cookieShapedMeta }),
    ).toStrictEqual({
      isGroupingEnabled: false,
      isGroupingLocked: false,
      isKeysetEnabled: false,
      isServerFilterEnabled: false,
    });
  });
});
