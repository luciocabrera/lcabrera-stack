import type { KeyboardEvent } from 'react';

import { describe, expect, it, vi } from 'vitest';

import { handleDivTriggerKeyDown } from './handleDivTriggerKeyDown.util';

type CreateKeyboardEventArgs = {
  readonly key: string;
  readonly preventDefault: ReturnType<typeof vi.fn>;
};

const createKeyboardEvent = ({
  key,
  preventDefault,
}: CreateKeyboardEventArgs) =>
  ({
    key,
    preventDefault,
  }) as unknown as KeyboardEvent<HTMLDivElement>;

describe('handleDivTriggerKeyDown', () => {
  it('toggles and prevents default for Enter and Space', () => {
    const onToggle = vi.fn();
    const preventDefault = vi.fn();

    handleDivTriggerKeyDown({
      event: createKeyboardEvent({ key: 'Enter', preventDefault }),
      onToggle,
    });

    handleDivTriggerKeyDown({
      event: createKeyboardEvent({ key: ' ', preventDefault }),
      onToggle,
    });

    expect(preventDefault).toHaveBeenCalledTimes(2);
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('ignores other keys', () => {
    const onToggle = vi.fn();
    const preventDefault = vi.fn();

    handleDivTriggerKeyDown({
      event: createKeyboardEvent({ key: 'Escape', preventDefault }),
      onToggle,
    });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(onToggle).not.toHaveBeenCalled();
  });
});
