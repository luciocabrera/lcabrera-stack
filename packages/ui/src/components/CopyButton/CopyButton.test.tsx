// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CopyButton } from './CopyButton.component';

afterEach(cleanup);

describe('CopyButton', () => {
  const writeTextMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.useFakeTimers();
    writeTextMock.mockClear();
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies the value to the clipboard when clicked', async () => {
    render(<CopyButton label='Copy JSON' value='{"a":1}' />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy JSON' }));
    });

    expect(writeTextMock).toHaveBeenCalledWith('{"a":1}');
  });

  it('shows a confirmation label after copying, then reverts', async () => {
    render(<CopyButton label='Copy JSON' value='{"a":1}' />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy JSON' }));
    });

    expect(screen.getByRole('button', { name: 'Copied' })).toBeDefined();

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeDefined();
  });
});
