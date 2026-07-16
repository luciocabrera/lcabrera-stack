import { describe, expect, it } from 'vitest';

import { resolveResizeWidth } from './resolveResizeWidth.util';

const bounds = { maxWidth: 260, minWidth: 120 };

describe('resolveResizeWidth', () => {
  it('applies the pointer delta to the starting width', () => {
    expect(
      resolveResizeWidth({
        ...bounds,
        clientX: 130,
        initialWidth: 200,
        initialX: 100,
      }),
    ).toBe(230);
  });

  it('clamps to the max width when dragging past the upper bound', () => {
    expect(
      resolveResizeWidth({
        ...bounds,
        clientX: 400,
        initialWidth: 200,
        initialX: 100,
      }),
    ).toBe(260);
  });

  it('clamps to the min width when dragging past the lower bound', () => {
    expect(
      resolveResizeWidth({
        ...bounds,
        clientX: 0,
        initialWidth: 200,
        initialX: 100,
      }),
    ).toBe(120);
  });
});
