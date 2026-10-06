// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { TABLE_CELL_NEUTRAL_TONE } from '#ui/components/Table/cellRenderers/cellRenderers.constants';

import { TableCellBadge } from './TableCellBadge.component';
import { TABLE_CELL_BADGE_RENDERER } from './TableCellBadge.constants';

afterEach(cleanup);

const PARAMS = {
  fallbackTone: 'neutral',
  rules: [{ gte: 4, tone: 'success' }],
};

const tones: string[] = [];
const tone = (name: string) => {
  tones.push(name);
  return { background: `bg-${name}`, text: `fg-${name}` };
};

describe('TableCellBadge', () => {
  it('shows its content as text and titles a string', () => {
    render(<TableCellBadge tone={TABLE_CELL_NEUTRAL_TONE}>3.5</TableCellBadge>);

    const badge = screen.getByTestId('table-cell-badge');

    expect(badge.textContent).toBe('3.5');
    expect(badge.getAttribute('title')).toBe('3.5');
  });

  it('paints the tone it is given', () => {
    render(
      <TableCellBadge tone={{ background: '#123456', text: '#fedcba' }}>
        x
      </TableCellBadge>,
    );

    const style = screen.getByTestId('table-cell-badge').getAttribute('style');

    expect(style).toContain('#123456');
    expect(style).toContain('#fedcba');
  });
});

describe('TABLE_CELL_BADGE_RENDERER', () => {
  it('draws the formatted value in the tone of the first matching rule', () => {
    render(
      TABLE_CELL_BADGE_RENDERER.render({
        formatted: '4.0',
        params: PARAMS,
        row: {},
        tone,
        value: 4,
      }),
    );

    expect(screen.getByTestId('table-cell-badge').textContent).toBe('4.0');
    expect(tones.at(-1)).toBe('success');
  });

  it('uses fallbackTone on a miss', () => {
    render(
      TABLE_CELL_BADGE_RENDERER.render({
        formatted: '1',
        params: PARAMS,
        row: {},
        tone,
        value: 1,
      }),
    );

    expect(tones.at(-1)).toBe('neutral');
  });

  it('draws no pill for an empty value', () => {
    expect(
      TABLE_CELL_BADGE_RENDERER.render({
        formatted: '',
        params: PARAMS,
        row: {},
        tone,
        value: JSON.parse('null'),
      }),
    ).toBeUndefined();
  });
});
