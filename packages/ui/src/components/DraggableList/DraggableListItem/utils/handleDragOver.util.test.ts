import { describe, expect, it, vi } from 'vite-plus/test';

import { handleDragOver } from './handleDragOver.util';

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
