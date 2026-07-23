import type { ColumnSizingState } from '@lcabrera/ui/components/Table/Table.types';

import { describe, expect, it } from 'vite-plus/test';

import { buildColumnSizingCookieEntry } from './buildColumnSizingCookieEntry.util';

const columnSizing: ColumnSizingState = { id: 120 };

describe('buildColumnSizingCookieEntry', () => {
  it('returns undefined when there is no persistence key', () => {
    expect(
      buildColumnSizingCookieEntry({ columnSizing, persistenceKey: undefined }),
    ).toBeUndefined();
  });

  it('returns undefined when there is no column sizing', () => {
    expect(
      buildColumnSizingCookieEntry({
        columnSizing: undefined,
        persistenceKey: 'orders',
      }),
    ).toBeUndefined();
  });

  it('serializes the columnSizing slice into an app-scoped cookie-only entry', () => {
    expect(
      buildColumnSizingCookieEntry({
        appId: 'admin',
        columnSizing,
        persistenceKey: 'orders',
      }),
    ).toEqual({
      key: 'table-state-admin-orders-columnSizing',
      searchParamKey: '',
      searchParamValue: '',
      value: JSON.stringify({ value: { id: 120 }, version: 1 }),
    });
  });
});
