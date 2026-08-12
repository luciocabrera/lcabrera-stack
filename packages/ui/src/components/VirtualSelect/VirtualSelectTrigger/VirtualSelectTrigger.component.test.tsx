// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

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
    isOpen: false,
    listboxId: 'listbox-id',
    mode: 'single',
    placeholder: 'Pick one',
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

vi.mock('../contexts/meta/actions', () => ({
  useToggleDropdown: () => toggleDropdownMock,
}));

vi.mock('../contexts/meta/selectors', () => ({
  useGetIsAlwaysOpen: () => metaState.current.isAlwaysOpen,
  useGetIsBusy: () => metaState.current.isBusy,
  useGetIsOpen: () => metaState.current.isOpen,
  useGetListboxId: () => metaState.current.listboxId,
  useGetMode: () => metaState.current.mode,
  useGetPlaceholder: () => metaState.current.placeholder,
}));

vi.mock('#ui/components/VirtualList/contexts/data/actions', () => ({
  useToggleOption: () => toggleOptionMock,
}));

vi.mock('#ui/components/VirtualList/contexts/data/selectors', () => ({
  useGetSelectedValues: useGetSelectedValuesMock,
}));

vi.mock('../hooks', () => ({
  useVirtualSelectTagOverflow: useVirtualSelectTagOverflowMock,
}));

import { VirtualSelectTrigger } from './VirtualSelectTrigger.component';

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

describe('VirtualSelectTrigger', () => {
  it('renders the placeholder in the native button trigger and dispatches the toggle action', () => {
    render(<VirtualSelectTrigger />);

    const trigger = screen.getByRole('button', { name: 'Pick one' });

    expect(trigger.tagName).toBe('BUTTON');

    fireEvent.click(trigger);

    expect(toggleDropdownMock).toHaveBeenCalledTimes(1);
  });

  it('renders the selected single label from the store', () => {
    useGetSelectedValuesMock.mockReturnValue(['Alpha']);
    useVirtualSelectTagOverflowMock.mockReturnValue(1);

    render(<VirtualSelectTrigger />);

    expect(screen.getByRole('button', { name: 'Alpha' })).toBeTruthy();
  });

  it('renders disabled and does not toggle while busy', () => {
    setMetaState({ isBusy: true });

    render(<VirtualSelectTrigger />);

    const trigger = screen.getByRole('button', { name: 'Pick one' });

    expect(trigger.hasAttribute('disabled')).toBe(true);

    fireEvent.click(trigger);

    expect(toggleDropdownMock).not.toHaveBeenCalled();
  });

  it('renders multi-mode tags and dispatches removal through the toggle-option action', () => {
    setMetaState({ mode: 'multi' });
    useGetSelectedValuesMock.mockReturnValue(['Alpha', 'Bravo']);
    useVirtualSelectTagOverflowMock.mockReturnValue(2);

    render(<VirtualSelectTrigger />);

    expect(screen.getByRole('button', { name: 'Remove Bravo' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Remove Alpha' }));

    expect(toggleOptionMock).toHaveBeenCalledWith('Alpha');
  });

  it('hides overflowing tags behind the "+N more" badge', () => {
    setMetaState({ mode: 'multi' });
    useGetSelectedValuesMock.mockReturnValue(['Alpha', 'Bravo', 'Charlie']);
    useVirtualSelectTagOverflowMock.mockReturnValue(1);

    render(<VirtualSelectTrigger />);

    expect(screen.getByRole('button', { name: 'Remove Alpha' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Remove Bravo' })).toBeNull();
    expect(screen.getByText('+2 more')).toBeTruthy();
  });

  it('renders the static div shell without interaction when always open', () => {
    setMetaState({ isAlwaysOpen: true });

    render(<VirtualSelectTrigger />);

    expect(screen.queryByRole('button')).toBeNull();
    expect(document.querySelector('[data-chevron]')).toBeNull();
  });
});
