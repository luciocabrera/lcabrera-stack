// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SidePanelHeaderToolbar } from './SidePanelHeaderToolbar.component';

afterEach(() => {
  cleanup();
});

describe('SidePanelHeaderToolbar', () => {
  it('shows "Pin drawer" button when not pinned', () => {
    render(
      <SidePanelHeaderToolbar
        isPinned={false}
        onClose={() => void 0}
        onTogglePin={() => void 0}
      />,
    );
    expect(screen.getByRole('button', { name: 'Pin drawer' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Close drawer' })).not.toBeNull();
  });

  it('shows "Unpin drawer" button when pinned', () => {
    render(
      <SidePanelHeaderToolbar
        isPinned
        onClose={() => void 0}
        onTogglePin={() => void 0}
      />,
    );
    expect(screen.getByRole('button', { name: 'Unpin drawer' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Close drawer' })).not.toBeNull();
  });

  it('calls onTogglePin when pin button is clicked', () => {
    const onTogglePin = vi.fn();
    render(
      <SidePanelHeaderToolbar
        isPinned={false}
        onClose={() => void 0}
        onTogglePin={onTogglePin}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pin drawer' }));
    expect(onTogglePin).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <SidePanelHeaderToolbar
        isPinned={false}
        onClose={onClose}
        onTogglePin={() => void 0}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close drawer' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
