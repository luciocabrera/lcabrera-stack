import { describe, expect, it } from 'vite-plus/test';

import { isPeriodCapableType } from './is-period-capable-type.util.ts';

describe('isPeriodCapableType', () => {
  it('admits the three temporal types a granularity means something for', () => {
    for (const typeName of ['date', 'timestamp', 'timestamptz']) {
      expect(
        isPeriodCapableType({ typeName, typeNamespace: 'pg_catalog' }),
      ).toBe(true);
    }
  });

  it('refuses `time`, which is category D and has no calendar', () => {
    expect(
      isPeriodCapableType({ typeName: 'time', typeNamespace: 'pg_catalog' }),
    ).toBe(false);
    expect(
      isPeriodCapableType({ typeName: 'timetz', typeNamespace: 'pg_catalog' }),
    ).toBe(false);
  });

  it('refuses a type name borrowed by another schema', () => {
    expect(
      isPeriodCapableType({ typeName: 'date', typeNamespace: 'app' }),
    ).toBe(false);
  });

  it('refuses everything else', () => {
    expect(
      isPeriodCapableType({ typeName: 'text', typeNamespace: 'pg_catalog' }),
    ).toBe(false);
  });
});
