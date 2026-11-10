// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { confusionTableColumns } from './confusionTableColumns.util';
import { CORNER, EMPTY_CELL } from './EvalsConfusion.constants';

const CELL = { column: 'react-19', count: 38, isMisload: false, label: '38' };

afterEach(cleanup);

describe('confusionTableColumns', () => {
  it('puts the expectation first, a right-aligned column per loaded skill, then the trials', () => {
    expect(
      confusionTableColumns(['react-19', '(none)']).map(
        ({ align, dataType, key, label }) => [key, label, align, dataType],
      ),
    ).toEqual([
      ['expected', CORNER, undefined, undefined],
      ['loaded:react-19', 'react-19', 'end', 'number'],
      ['loaded:(none)', '(none)', 'end', 'number'],
      ['trials', 'Trials', 'end', 'number'],
    ]);
  });

  it('draws the cell of its own loaded column', () => {
    const [, loaded] = confusionTableColumns(['react-19']);

    render(
      <div>
        {loaded?.render?.({
          expected: 'react-19',
          'loaded:react-19': CELL,
          trials: 45,
        })}
      </div>,
    );

    expect(screen.getByText('38')).toBeDefined();
  });

  it('marks a row with no cell under the column as empty', () => {
    const [, loaded] = confusionTableColumns(['react-19']);

    render(<div>{loaded?.render?.({ expected: 'react-19', trials: 45 })}</div>);

    expect(screen.getByText(EMPTY_CELL)).toBeDefined();
  });
});
