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

    // `preventDefault` only to keep jsdom from warning that it cannot
    // navigate; the click itself is what is being asserted.
    anchor?.addEventListener('click', (event) => {
      event.preventDefault();
      click();
    });

    expect(activateGridCellLink(cell)).toBe(true);
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('declines a cell with no link, leaving the key to the page', () => {
    // The grid claims `Enter` only where it acts; claiming it everywhere would
    // swallow the key on every ordinary cell.
    expect(activateGridCellLink(cellWith('<span>Iberia</span>'))).toBe(false);
  });

  it('declines an anchor with no href, which is not a link', () => {
    expect(activateGridCellLink(cellWith('<a>not a link</a>'))).toBe(false);
  });

  it('declines a target that is not an element', () => {
    expect(activateGridCellLink(globalThis.window)).toBe(false);
  });

  it('declines the grid element, which contains every cell', () => {
    // The key handler admits the grid container as its own target, and that
    // container holds the tab stop whenever the focused row is outside the
    // virtualization window. Searching its subtree would find the first link in
    // the whole table, so `Enter` with no cell focused would navigate into some
    // unrelated group's hand-off.
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
    // A cell with two actions has no unambiguous "the" action; this states
    // which one is taken rather than leaving it to DOM order by accident.
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
