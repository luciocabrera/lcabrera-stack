import { describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

import { nullAsAbsent } from './nullAsAbsent.util.ts';

const schema = z.object({ count: nullAsAbsent(z.number()) });

describe('nullAsAbsent', () => {
  it('reads a SQL null as an absent value', () => {
    expect(schema.parse(JSON.parse('{"count":null}'))).toEqual({
      count: undefined,
    });
  });

  it('keeps a present value and still checks it', () => {
    expect(schema.parse({ count: 3 })).toEqual({ count: 3 });
    expect(schema.safeParse({ count: 'three' }).success).toBe(false);
  });
});
