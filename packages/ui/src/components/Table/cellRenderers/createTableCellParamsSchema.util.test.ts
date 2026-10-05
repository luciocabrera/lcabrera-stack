import { describe, expect, it } from 'vite-plus/test';

import { createTableCellParamsSchema } from './createTableCellParamsSchema.util';

describe('createTableCellParamsSchema', () => {
  it('wraps a parser in the Standard Schema shape', () => {
    const schema = createTableCellParamsSchema((value) =>
      value === 1 ? { value: 'one' } : { issues: [{ message: 'not one' }] },
    );

    expect(schema['~standard'].version).toBe(1);
    expect(schema['~standard'].vendor).toBe('@lcabrera/ui');
    expect(schema['~standard'].validate(1)).toEqual({ value: 'one' });
    expect(schema['~standard'].validate(2)).toEqual({
      issues: [{ message: 'not one' }],
    });
  });
});
