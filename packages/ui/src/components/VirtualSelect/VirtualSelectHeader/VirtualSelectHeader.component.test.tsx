// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  metaState,
  setMetaState,
  toggleDropdownMock,
  toggleOptionMock,
  useGetSelectedValuesMock,
  useVirtualSelectTagOverflowMock,
} = vi.hoisted(() => {
  const initialMetaState = {
    isAlwaysOpen: false,
    isBusy: false,
    isListVisible: false,
    isOpen: false,
    listboxId: 'listbox-id',
    listMaxHeight: '18.75rem',
    mode: 'single',
    placeholder: 'Select...',
    shouldFillHeight: false,
  };
  const state = { current: { ...initialMetaState } };

  return {
    metaState: state,
    setMetaState: (next: Partial<typeof initialMetaState>) => {
      state.current = { ...initialMetaState, ...next };
    },
    toggleDropdownMock: vi.fn(),
    toggleOptionMock: vi.fn(),
    useGetSelectedValuesMock: vi.fn<() => readonly string[]>(() => []),
    useVirtualSelectTagOverflowMock: vi.fn(() => 0),
  };
});

vi.mock('../contexts/VirtualSelectConfig/meta/actions', () => ({
  useToggleDropdown: () => toggleDropdownMock,
}));

vi.mock('../contexts/VirtualSelectConfig/meta/selectors', () => ({
  useGetIsAlwaysOpen: () => metaState.current.isAlwaysOpen,
  useGetIsBusy: () => metaState.current.isBusy,
  useGetIsOpen: () => metaState.current.isOpen,
  useGetListboxId: () => metaState.current.listboxId,
  useGetMode: () => metaState.current.mode,
  useGetPlaceholder: () => metaState.current.placeholder,
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

beforeEach(() => {
  setMetaState({});
  useGetSelectedValuesMock.mockReturnValue([]);
  useVirtualSelectTagOverflowMock.mockReturnValue(0);
});

afterEach(() => {
  toggleDropdownMock.mockClear();
  toggleOptionMock.mockClear();
  cleanup();
});

describe('VirtualSelectHeader', () => {
  it('renders the trigger from the meta selectors and dispatches the toggle action', () => {
    render(<VirtualSelectHeader />);

    expect(document.querySelector('[aria-hidden="true"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Select...' }));

    expect(toggleDropdownMock).toHaveBeenCalledTimes(1);
  });

  it('renders the shimmer overlay and a disabled trigger while busy', () => {
    setMetaState({ isBusy: true });

    render(<VirtualSelectHeader />);

    expect(document.querySelector('[aria-hidden="true"]')).not.toBeNull();

    const trigger = screen.getByRole('button', { name: 'Select...' });

    expect(trigger.hasAttribute('disabled')).toBe(true);

    fireEvent.click(trigger);

    expect(toggleDropdownMock).not.toHaveBeenCalled();
  });

  it('renders the store-selected labels as tags and dispatches removal through the toggle action', () => {
    setMetaState({ mode: 'multi' });
    useGetSelectedValuesMock.mockReturnValue(['Alpha', 'Bravo']);
    useVirtualSelectTagOverflowMock.mockReturnValue(2);

    render(<VirtualSelectHeader />);

    expect(screen.getByRole('button', { name: 'Remove Bravo' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Remove Alpha' }));

    expect(toggleOptionMock).toHaveBeenCalledWith('Alpha');
  });

  it('hides overflowing tags behind the "+N more" badge', () => {
    setMetaState({ mode: 'multi' });
    useGetSelectedValuesMock.mockReturnValue(['Alpha', 'Bravo', 'Charlie']);
    useVirtualSelectTagOverflowMock.mockReturnValue(1);

    render(<VirtualSelectHeader />);

    expect(screen.getByRole('button', { name: 'Remove Alpha' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Remove Bravo' })).toBeNull();
    expect(screen.getByText('+2 more')).toBeTruthy();
  });
});
