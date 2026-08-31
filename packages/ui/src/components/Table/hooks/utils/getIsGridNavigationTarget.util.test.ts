// @vitest-environment jsdom

import { describe, expect, it } from 'vite-plus/test';

import { getIsGridNavigationTarget } from './getIsGridNavigationTarget.util';

const buildGrid = () => {
  const grid = document.createElement('table');
  grid.setAttribute('role', 'grid');

  const cell = document.createElement('td');
  cell.setAttribute('role', 'gridcell');

  const control = document.createElement('button');
  cell.append(control);
  grid.append(cell);

  return { cell, control, grid };
};

describe('getIsGridNavigationTarget', () => {
  it('claims a key pressed on the grid container', () => {
    const { grid } = buildGrid();

    expect(getIsGridNavigationTarget({ grid, target: grid })).toBe(true);
  });

  it('claims a key pressed on a grid cell', () => {
    const { cell, grid } = buildGrid();

    expect(getIsGridNavigationTarget({ grid, target: cell })).toBe(true);
  });

  it('leaves a key pressed on a control inside a cell to that control', () => {
    const { control, grid } = buildGrid();

    expect(getIsGridNavigationTarget({ grid, target: control })).toBe(false);
  });

  it('claims nothing when there is no target', () => {
    const { grid } = buildGrid();

    expect(getIsGridNavigationTarget({ grid, target: undefined })).toBe(false);
  });
});
