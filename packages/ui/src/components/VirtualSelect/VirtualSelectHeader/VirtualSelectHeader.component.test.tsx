// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  toggleOptionMock,
  useGetSelectedValuesMock,
  useVirtualSelectTagOverflowMock,
} = vi.hoisted(() => ({
  toggleOptionMock: vi.fn(),
  useGetSelectedValuesMock: vi.fn<() => readonly string[]>(() => []),
  useVirtualSelectTagOverflowMock: vi.fn(() => 0),
}));

vi.mock(
  '@repo/ui/components/VirtualList/contexts/VirtualListData/data/actions',
  () => ({
    useToggleOption: () => toggleOptionMock,
  }),
);

vi.mock(
  '@repo/ui/components/VirtualList/contexts/VirtualListData/data/selectors',
  () => ({
    useGetSelectedValues: useGetSelectedValuesMock,
  }),
);

vi.mock('../hooks', () => ({
  useVirtualSelectTagOverflow: useVirtualSelectTagOverflowMock,
}));

import { VirtualSelectHeader } from './VirtualSelectHeader.component';

const createProps = () => ({
  isAlwaysOpen: false,
  isBusy: false,
  isOpen: false,
  listboxId: 'listbox-id',
  mode: 'single' as const,
  onToggle: vi.fn(),
  placeholder: 'Select...',
});

beforeEach(() => {
  useGetSelectedValuesMock.mockReturnValue([]);
  useVirtualSelectTagOverflowMock.mockReturnValue(0);
});

afterEach(() => {
  toggleOptionMock.mockClear();
  cleanup();
});

describe('VirtualSelectHeader', () => {
  it('renders the trigger without an overlay and toggles on click', () => {
    const props = createProps();

    render(<VirtualSelectHeader {...props} />);

    expect(document.querySelector('[aria-hidden="true"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Select...' }));

    expect(props.onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders the shimmer overlay and a disabled trigger while busy', () => {
    const props = { ...createProps(), isBusy: true };

    render(<VirtualSelectHeader {...props} />);

    expect(document.querySelector('[aria-hidden="true"]')).not.toBeNull();

    const trigger = screen.getByRole('button', { name: 'Select...' });

    expect(trigger.hasAttribute('disabled')).toBe(true);

    fireEvent.click(trigger);

    expect(props.onToggle).not.toHaveBeenCalled();
  });

  it('renders the store-selected labels as tags and dispatches removal through the toggle action', () => {
    useGetSelectedValuesMock.mockReturnValue(['Alpha', 'Bravo']);
    useVirtualSelectTagOverflowMock.mockReturnValue(2);

    render(<VirtualSelectHeader {...createProps()} mode='multi' />);

    expect(screen.getByRole('button', { name: 'Remove Bravo' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Remove Alpha' }));

    expect(toggleOptionMock).toHaveBeenCalledWith('Alpha');
  });

  it('hides overflowing tags behind the "+N more" badge', () => {
    useGetSelectedValuesMock.mockReturnValue(['Alpha', 'Bravo', 'Charlie']);
    useVirtualSelectTagOverflowMock.mockReturnValue(1);

    render(<VirtualSelectHeader {...createProps()} mode='multi' />);

    expect(screen.getByRole('button', { name: 'Remove Alpha' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Remove Bravo' })).toBeNull();
    expect(screen.getByText('+2 more')).toBeTruthy();
  });
});
