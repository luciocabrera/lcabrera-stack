import { describe, expectTypeOf, it } from 'vite-plus/test';

import type {
  TableChromeState,
  TableGroupingState,
  TableMetaState,
} from '#ui/components/Table/Table.types';

describe('table density chrome', () => {
  it('chrome and meta do not carry grouping query fields', () => {
    expectTypeOf<TableChromeState>().toHaveProperty('density');
    expectTypeOf<TableChromeState>().not.toHaveProperty('keys');
    expectTypeOf<TableChromeState>().not.toHaveProperty('totalsPlacement');
    expectTypeOf<TableMetaState>().not.toHaveProperty('groupingKeys');
    expectTypeOf<TableMetaState>().not.toHaveProperty('error');
    expectTypeOf<TableGroupingState>().toHaveProperty('keys');
    expectTypeOf<TableGroupingState>().toHaveProperty('totalsPlacement');
  });
});
