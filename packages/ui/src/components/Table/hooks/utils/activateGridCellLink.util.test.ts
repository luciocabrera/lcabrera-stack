// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vite-plus/test';

import { activateGridCellLink } from './activateGridCellLink.util';

const cellWith = (html: string) => {
  const cell = document.createElement('td');

  cell.setAttribute('role', 'gridcell');
  cell.innerHTML = html;

  return cell;
};

describe('activateGridCellLink', () => {
  it('follows the link a cell holds', () => {
    const cell = cellWith('<a href="/orders?filters=x">214 more rows</a>');
    const anchor = cell.querySelector('a');
    const click = vi.fn();

    anchor?.addEventListener('click', (event) => {
      event.preventDefault();
      click();
    });

    expect(activateGridCellLink(cell)).toBe(true);
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('declines a cell with no link, leaving the key to the page', () => {
    expect(activateGridCellLink(cellWith('<span>Iberia</span>'))).toBe(false);
  });

  it('declines an anchor with no href, which is not a link', () => {
    expect(activateGridCellLink(cellWith('<a>not a link</a>'))).toBe(false);
  });

  it('declines a target that is not an element', () => {
    expect(activateGridCellLink(globalThis.window)).toBe(false);
  });

  it('declines the grid element, which contains every cell', () => {
    const grid = document.createElement('table');

    grid.setAttribute('role', 'grid');
    grid.innerHTML =
      '<tbody><tr><td role="gridcell"><a href="/elsewhere">214 more rows</a></td></tr></tbody>';

    const anchor = grid.querySelector('a');
    const click = vi.fn();

    anchor?.addEventListener('click', (event) => {
      event.preventDefault();
      click();
    });

    expect(activateGridCellLink(grid)).toBe(false);
    expect(click).not.toHaveBeenCalled();
  });

  it('declines a cell-shaped element that is not a gridcell', () => {
    const cell = document.createElement('td');

    cell.innerHTML = '<a href="/elsewhere">link</a>';

    expect(activateGridCellLink(cell)).toBe(false);
  });

  it('takes the first link when a cell holds more than one', () => {
    const cell = cellWith('<a href="/first">one</a><a href="/second">two</a>');
    const clicks: string[] = [];

    for (const anchor of cell.querySelectorAll('a')) {
      anchor.addEventListener('click', (event) => {
        event.preventDefault();
        clicks.push(anchor.textContent ?? '');
      });
    }

    activateGridCellLink(cell);

    expect(clicks).toEqual(['one']);
  });
});
