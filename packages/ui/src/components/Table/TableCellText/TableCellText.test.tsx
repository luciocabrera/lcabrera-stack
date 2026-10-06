// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { TABLE_CELL_NEUTRAL_TONE } from '#ui/components/Table/cellRenderers/cellRenderers.constants';

import { TableCellText } from './TableCellText.component';
import { TABLE_CELL_TEXT_RENDERER } from './TableCellText.constants';

afterEach(cleanup);

describe('TableCellText', () => {
  it('titles a string so a truncated value can still be read', () => {
    render(<TableCellText>a-long-skill-name</TableCellText>);

    expect(screen.getByText('a-long-skill-name').getAttribute('title')).toBe(
      'a-long-skill-name',
    );
  });

  it('styles monospace and bold apart from the regular span', () => {
    render(
      <>
        <TableCellText>plain</TableCellText>
        <TableCellText isMonospace weight='bold'>
          styled
        </TableCellText>
      </>,
    );

    expect(screen.getByText('styled').className).not.toBe(
      screen.getByText('plain').className,
    );
  });
});

describe('TABLE_CELL_TEXT_RENDERER', () => {
  it('draws the formatted value, not the raw one', () => {
    render(
      TABLE_CELL_TEXT_RENDERER.render({
        formatted: '3.8',
        params: { monospace: false, weight: 'bold' },
        row: {},
        tone: () => TABLE_CELL_NEUTRAL_TONE,
        value: 3.84,
      }),
    );

    expect(screen.getByText('3.8')).toBeDefined();
  });
});
