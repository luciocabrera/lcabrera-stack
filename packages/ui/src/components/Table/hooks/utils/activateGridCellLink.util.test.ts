// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vite-plus/test';

import { activateGridCellLink } from './activateGridCellLink.util';

const cellWith = (html: string) => {
  const cell = document.createElement('td');

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
    // `event.target` is only typed as an `EventTarget`, and the grid's key
    // handler also fires for the grid element itself.
    expect(activateGridCellLink(globalThis.window)).toBe(false);
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
