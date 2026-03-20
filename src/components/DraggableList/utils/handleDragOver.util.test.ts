import { describe, expect, it, vi } from 'vitest';

import { handleDragOver } from './handleDragOver.util';

describe('handleDragOver', () => {
  it('calls event.preventDefault()', () => {
    const event = {
      preventDefault: vi.fn(),
    } as unknown as React.DragEvent<HTMLLIElement>;
    handleDragOver(event);
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });
});
