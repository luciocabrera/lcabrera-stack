// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { getShouldApplyCellFocus } from './getShouldApplyCellFocus.util';

const buildGrid = () => {
  const grid = document.createElement('table');
  grid.setAttribute('role', 'grid');

  const body = document.createElement('tbody');
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  const otherCell = document.createElement('td');

  row.append(cell, otherCell);
  body.append(row);
  grid.append(body);
  document.body.append(grid);

  return { cell, grid, otherCell };
};

afterEach(() => {
  document.body.replaceChildren();
});

describe('getShouldApplyCellFocus', () => {
  it('applies when nothing holds focus', () => {
    const { cell } = buildGrid();

    expect(getShouldApplyCellFocus({ activeElement: undefined, cell })).toBe(
      true,
    );
  });

  it('applies when focus fell to the document body', () => {
    const { cell } = buildGrid();

    expect(
      getShouldApplyCellFocus({ activeElement: document.body, cell }),
    ).toBe(true);
  });

  it('applies when the grid already holds focus', () => {
    const { cell, grid, otherCell } = buildGrid();

    expect(getShouldApplyCellFocus({ activeElement: grid, cell })).toBe(true);
    expect(getShouldApplyCellFocus({ activeElement: otherCell, cell })).toBe(
      true,
    );
  });

  it('refuses when focus has moved somewhere else on the page', () => {
    // A row the user scrolled away from re-mounts with its request still
    // standing; honouring it here would yank focus out of whatever they moved
    // on to.
    const { cell } = buildGrid();
    const outside = document.createElement('button');
    document.body.append(outside);

    expect(getShouldApplyCellFocus({ activeElement: outside, cell })).toBe(
      false,
    );
  });

  it('refuses for a cell that is not inside a grid at all', () => {
    const orphan = document.createElement('td');
    const outside = document.createElement('button');
    document.body.append(outside);

    expect(
      getShouldApplyCellFocus({ activeElement: outside, cell: orphan }),
    ).toBe(false);
  });
});
