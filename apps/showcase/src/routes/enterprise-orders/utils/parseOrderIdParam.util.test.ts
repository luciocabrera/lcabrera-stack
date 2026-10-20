import { expect, it } from 'vite-plus/test';

import { parseOrderIdParam } from './parseOrderIdParam.util';

it('returns the numeric id for a valid param', () => {
  expect(parseOrderIdParam('7')).toBe(7);
});

it.each([
  { name: 'a missing param', param: undefined },
  { name: 'a non-numeric param', param: 'abc' },
  { name: 'a zero id', param: '0' },
  { name: 'a negative id', param: '-3' },
])('throws a 400 for $name', ({ param }) => {
  expect(() => parseOrderIdParam(param)).toThrow(
    expect.objectContaining({
      data: 'Invalid order ID.',
      init: { status: 400 },
    }),
  );
});
