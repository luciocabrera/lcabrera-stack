import { describe, expect, it } from 'vite-plus/test';

import { resolveSidePanelResizeWidth } from './resolveSidePanelResizeWidth.util';

const bounds = { maxWidth: 800, minWidth: 320 } as const;

describe('resolveSidePanelResizeWidth', () => {
  it('widens a right-hand panel as the pointer travels left', () => {
    expect(
      resolveSidePanelResizeWidth({
        ...bounds,
        clientX: 900,
        initialWidth: 400,
        initialX: 1000,
        position: 'right',
      }),
    ).toBe(500);
  });

  it('widens a left-hand panel as the pointer travels right', () => {
    expect(
      resolveSidePanelResizeWidth({
        ...bounds,
        clientX: 500,
        initialWidth: 400,
        initialX: 400,
        position: 'left',
      }),
    ).toBe(500);
  });

  it('holds the panel inside its band', () => {
    expect({
      dragged: resolveSidePanelResizeWidth({
        ...bounds,
        clientX: 0,
        initialWidth: 400,
        initialX: 1000,
        position: 'right',
      }),
      squeezed: resolveSidePanelResizeWidth({
        ...bounds,
        clientX: 2000,
        initialWidth: 400,
        initialX: 1000,
        position: 'right',
      }),
    }).toStrictEqual({ dragged: 800, squeezed: 320 });
  });
});
