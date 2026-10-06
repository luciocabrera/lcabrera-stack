import { describe, expect, it } from 'vite-plus/test';

import { isEmptyCellValue } from './isEmptyCellValue.util';

describe('isEmptyCellValue', () => {
  it.each([[JSON.parse('null')], [undefined], ['']])(
    'treats %j as empty',
    (value) => {
      expect(isEmptyCellValue(value)).toBe(true);
    },
  );

  it.each([[0], [false], ['0']])('treats %j as a value', (value) => {
    expect(isEmptyCellValue(value)).toBe(false);
  });
});
