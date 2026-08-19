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
    // `date_trunc` accepts it; truncating a time of day to a month is not a
    // question anybody asked, which is why the gate is by name and not by the
    // type category the role derivation uses.
    expect(
      isPeriodCapableType({ typeName: 'time', typeNamespace: 'pg_catalog' }),
    ).toBe(false);
    expect(
      isPeriodCapableType({ typeName: 'timetz', typeNamespace: 'pg_catalog' }),
    ).toBe(false);
  });

  it('refuses a type name borrowed by another schema', () => {
    // `CREATE TYPE app.date AS (…)` reports `typname = 'date'` exactly like the
    // built-in, and `date_trunc` would be handed a composite.
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
