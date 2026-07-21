import type { TableMetaState } from '@lcabrera/ui/components/Table/Table.types';

import { describe, expect, it } from 'vitest';

import { buildUiFlagsCookieEntry } from './buildUiFlagsCookieEntry.util';

describe('buildUiFlagsCookieEntry', () => {
  it('returns undefined when there is no persistence key', () => {
    expect(
      buildUiFlagsCookieEntry({
        currentState: { isTableSettingsOpen: false } as Partial<TableMetaState>,
        nextStatePatch: { isTableSettingsOpen: true },
      }),
    ).toBeUndefined();
  });

  it('serializes the merged drawer flags into an app-scoped cookie entry', () => {
    expect(
      buildUiFlagsCookieEntry({
        currentState: {
          appId: 'admin',
          isTableSettingsOpen: false,
          persistenceKey: 'orders',
        } as Partial<TableMetaState>,
        nextStatePatch: { isTableSettingsOpen: true },
      }),
    ).toEqual({
      key: 'table-state-admin-orders-uiFlags',
      searchParamKey: '',
      searchParamValue: '',
      value: JSON.stringify({
        value: { isTableSettingsOpen: true },
        version: 1,
      }),
    });
  });
});
