import { describe, expect, it } from 'vite-plus/test';

import { matchesCssColorSyntax } from './matchesCssColorSyntax.util';

describe('matchesCssColorSyntax', () => {
  it.each([
    '#fff',
    '#ffffff80',
    'red',
    'oklch(0.75 0.15 55)',
    'rgb(10 20 30 / 50%)',
    'hsl(120, 50%, 50%)',
  ])('accepts %s', (value) => {
    expect(matchesCssColorSyntax(value)).toBe(true);
  });

  it.each([
    '',
    '#ff',
    'not a color',
    'url(x)',
    'red; background: blue',
    'rgb(1 2 3)) ; x',
    'oklch(var(--x) 1 2)',
  ])('rejects %j', (value) => {
    expect(matchesCssColorSyntax(value)).toBe(false);
  });
});
