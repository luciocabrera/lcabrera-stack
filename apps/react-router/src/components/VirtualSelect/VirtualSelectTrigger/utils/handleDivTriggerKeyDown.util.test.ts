import type { KeyboardEvent } from 'react';

import { describe, expect, it, vi } from 'vitest';

import { handleDivTriggerKeyDown } from './handleDivTriggerKeyDown.util';

const createKeyboardEvent = (
  key: string,
  preventDefault: ReturnType<typeof vi.fn>,
) =>
  ({
    key,
    preventDefault,
  }) as unknown as KeyboardEvent<HTMLDivElement>;

describe('handleDivTriggerKeyDown', () => {
  it('toggles and prevents default for Enter and Space', () => {
    const onToggle = vi.fn();
    const preventDefault = vi.fn();

    handleDivTriggerKeyDown(
      createKeyboardEvent('Enter', preventDefault),
      onToggle,
    );

    handleDivTriggerKeyDown(createKeyboardEvent(' ', preventDefault), onToggle);

    expect(preventDefault).toHaveBeenCalledTimes(2);
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('ignores other keys', () => {
    const onToggle = vi.fn();
    const preventDefault = vi.fn();

    handleDivTriggerKeyDown(
      createKeyboardEvent('Escape', preventDefault),
      onToggle,
    );

    expect(preventDefault).not.toHaveBeenCalled();
    expect(onToggle).not.toHaveBeenCalled();
  });
});
