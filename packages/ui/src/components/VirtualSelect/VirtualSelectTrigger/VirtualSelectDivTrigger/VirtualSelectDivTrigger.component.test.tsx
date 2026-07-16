// @vitest-environment jsdom

import type { RefObject } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { metaState, setMetaState, toggleDropdownMock } = vi.hoisted(() => {
  const initialMetaState = {
    isAlwaysOpen: false,
    isBusy: false,
    isOpen: false,
    listboxId: 'listbox-id',
    mode: 'multi',
  };
  const state = { current: { ...initialMetaState } };

  return {
    metaState: state,
    setMetaState: (next: Partial<typeof initialMetaState>) => {
      state.current = { ...initialMetaState, ...next };
    },
    toggleDropdownMock: vi.fn(),
  };
});

vi.mock('../../contexts/meta/actions', () => ({
  useToggleDropdown: () => toggleDropdownMock,
}));

vi.mock('../../contexts/meta/selectors', () => ({
  useGetIsAlwaysOpen: () => metaState.current.isAlwaysOpen,
  useGetIsBusy: () => metaState.current.isBusy,
  useGetIsOpen: () => metaState.current.isOpen,
  useGetListboxId: () => metaState.current.listboxId,
  useGetMode: () => metaState.current.mode,
}));

import { VirtualSelectDivTrigger } from './VirtualSelectDivTrigger.component';

const createTriggerRef = () =>
  ({
    current: undefined,
  }) as RefObject<HTMLButtonElement | HTMLDivElement | undefined>;

beforeEach(() => {
  setMetaState({});
});

afterEach(() => {
  toggleDropdownMock.mockClear();
  cleanup();
});

describe('VirtualSelectDivTrigger', () => {
  it('renders an interactive div with listbox aria wiring and assigns the ref', () => {
    const triggerRef = createTriggerRef();

    render(
      <VirtualSelectDivTrigger triggerRef={triggerRef}>
        <span>Alpha</span>
      </VirtualSelectDivTrigger>,
    );

    const trigger = screen.getByRole('button');

    expect(trigger.tagName).toBe('DIV');
    expect(trigger.getAttribute('aria-controls')).toBe('listbox-id');
    expect(trigger.getAttribute('aria-disabled')).toBe('false');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger.getAttribute('tabindex')).toBe('0');
    expect(triggerRef.current).toBe(trigger);
    expect(screen.getByText('Alpha').textContent).toBe('Alpha');
  });

  it('dispatches the toggle action on click and on Enter/Space key presses only', () => {
    render(
      <VirtualSelectDivTrigger triggerRef={createTriggerRef()}>
        <span>Alpha</span>
      </VirtualSelectDivTrigger>,
    );

    const trigger = screen.getByRole('button');

    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.keyDown(trigger, { key: ' ' });
    fireEvent.keyDown(trigger, { key: 'Escape' });

    expect(toggleDropdownMock).toHaveBeenCalledTimes(3);
  });

  it('disables interaction while busy', () => {
    setMetaState({ isBusy: true });

    render(
      <VirtualSelectDivTrigger triggerRef={createTriggerRef()}>
        <span>Alpha</span>
      </VirtualSelectDivTrigger>,
    );

    const trigger = screen.getByRole('button');

    expect(trigger.getAttribute('aria-disabled')).toBe('true');
    expect(trigger.getAttribute('tabindex')).toBe('-1');

    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'Enter' });

    expect(toggleDropdownMock).not.toHaveBeenCalled();
  });

  it('renders a static non-interactive shell when always open', () => {
    setMetaState({ isAlwaysOpen: true });
    const triggerRef = createTriggerRef();

    const { container } = render(
      <VirtualSelectDivTrigger triggerRef={triggerRef}>
        <span>Alpha</span>
      </VirtualSelectDivTrigger>,
    );

    const trigger = container.firstChild as HTMLDivElement | null;

    expect(trigger?.tagName).toBe('DIV');
    expect(trigger?.getAttribute('role')).toBeNull();
    expect(trigger?.getAttribute('aria-expanded')).toBeNull();
    expect(triggerRef.current).toBe(trigger);
    expect(screen.getByText('Alpha').textContent).toBe('Alpha');
  });
});
