// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { TABLE_CELL_DELTA_RENDERER } from './TableCellDelta.constants';

afterEach(cleanup);

const PARAMS = {
  decrease: 'error',
  increase: 'success',
  precision: 1,
  unchanged: 'neutral',
};

const drawDelta = (value: unknown) => {
  const asked: string[] = [];
  const tone = (name: string) => {
    asked.push(name);
    return { background: `bg-${name}`, text: `fg-${name}` };
  };

  render(
    TABLE_CELL_DELTA_RENDERER.render({
      formatted: String(value),
      params: PARAMS,
      row: {},
      tone,
      value,
    }),
  );

  return asked;
};

describe('TABLE_CELL_DELTA_RENDERER', () => {
  it.each([
    { text: '▲ 0.3', toneName: 'success', value: 0.31 },
    { text: '▼ 0.2', toneName: 'error', value: -0.2 },
    { text: '±0.0', toneName: 'neutral', value: 0 },
  ])(
    'draws $value as $text in the $toneName tone',
    ({ text, toneName, value }) => {
      const asked = drawDelta(value);

      expect(screen.getByTestId('table-cell-badge').textContent).toBe(text);
      expect(asked).toEqual([toneName]);
    },
  );

  it('draws a value that is not a number as plain text', () => {
    const asked = drawDelta('n/a');

    expect(screen.getByText('n/a')).toBeDefined();
    expect(screen.queryByTestId('table-cell-badge')).toBeNull();
    expect(asked).toEqual([]);
  });
});
