import { describe, expect, it } from 'vite-plus/test';

import { parseSurface, renderSurface } from './api-surface-render.mjs';

const surface = {
  './a/first.util': { foo: '[const] (x: string) => void' },
  './b/types': {
    Bar: '[type] { readonly a: number; }',
    Baz: '[type] "x" | "y"',
  },
  './c/empty': {},
};

describe('renderSurface', () => {
  it('sorts subpaths and exports and ends with a newline', () => {
    const text = renderSurface({ packageName: '@lcabrera/x', surface });
    const subpaths = text
      .split('\n')
      .filter((line) => line.startsWith('## '))
      .map((line) => line.slice(3));
    expect(subpaths).toEqual(['./a/first.util', './b/types', './c/empty']);
    expect(text.endsWith('\n')).toBe(true);
  });

  it('round-trips through parseSurface, empty subpaths included', () => {
    const text = renderSurface({ packageName: '@lcabrera/x', surface });
    expect(parseSurface(text)).toEqual(surface);
  });

  it('renders deterministically regardless of input key order', () => {
    const shuffled = {
      './c/empty': {},
      './b/types': {
        Baz: '[type] "x" | "y"',
        Bar: '[type] { readonly a: number; }',
      },
      './a/first.util': { foo: '[const] (x: string) => void' },
    };
    expect(
      renderSurface({ packageName: '@lcabrera/x', surface: shuffled }),
    ).toBe(renderSurface({ packageName: '@lcabrera/x', surface }));
  });
});
