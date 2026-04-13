import { describe, expect, it, vi } from 'vitest';

import { handleDragOver } from './handleDragOver.util.ts';

describe('handleDragOver', () => {
  it('calls event.preventDefault()', () => {
    const preventDefault = vi.fn();
    const event = {
      preventDefault,
    } as unknown as React.DragEvent<HTMLLIElement>;
    handleDragOver(event);
    expect(preventDefault).toHaveBeenCalledOnce();
  });
});
