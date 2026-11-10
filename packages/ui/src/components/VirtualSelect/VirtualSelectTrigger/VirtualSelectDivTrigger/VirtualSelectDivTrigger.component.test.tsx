// @vitest-environment jsdom

import type { RefObject } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

const { metaState, setMetaState, toggleDropdownMock } = vi.hoisted(() => {
  const initialMetaState = {
    isAlwaysOpen: false,
    isInert: false,
    isOpen: false,
    labelId: undefined as string | undefined,
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

vi.mock('#ui/components/VirtualList/contexts/list/selectors', () => ({
  useGetIsTopAttached: () => false,
}));

vi.mock('../../contexts/meta/actions', () => ({
  useToggleDropdown: () => toggleDropdownMock,
}));

vi.mock('../../contexts/meta/selectors', () => ({
  useGetAttachedEdge: () => undefined,
  useGetIsAlwaysOpen: () => metaState.current.isAlwaysOpen,
  useGetIsInert: () => metaState.current.isInert,
  useGetIsOpen: () => metaState.current.isOpen,
  useGetLabelId: () => metaState.current.labelId,
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
  cleanup();
});

describe('VirtualSelectDivTrigger', () => {
  it('renders an interactive div with listbox aria wiring and assigns the ref', () => {
    const triggerRef = createTriggerRef();

    render(
      <VirtualSelectDivTrigger hasTags={false} triggerRef={triggerRef}>
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

  it('is named by the visible label and then by its own content', () => {
    setMetaState({ labelId: 'status' });

    render(
      <>
        <span id='status'>Status</span>
        <VirtualSelectDivTrigger
          hasTags={false}
          triggerRef={createTriggerRef()}
        >
          <span>Alpha</span>
        </VirtualSelectDivTrigger>
      </>,
    );

    const trigger = screen.getByRole('button', { name: 'Status Alpha' });

    expect(trigger.id).toBe('status-trigger');
  });

  it('dispatches the toggle action on click and on Enter/Space key presses only', () => {
    render(
      <VirtualSelectDivTrigger hasTags={false} triggerRef={createTriggerRef()}>
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

  it('disables interaction while inert', () => {
    setMetaState({ isInert: true });

    render(
      <VirtualSelectDivTrigger hasTags={false} triggerRef={createTriggerRef()}>
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
    setMetaState({ isAlwaysOpen: true, labelId: 'status' });
    const triggerRef = createTriggerRef();

    const { container } = render(
      <VirtualSelectDivTrigger hasTags={false} triggerRef={triggerRef}>
        <span>Alpha</span>
      </VirtualSelectDivTrigger>,
    );

    const trigger = container.firstChild as HTMLDivElement | null;

    expect(trigger?.tagName).toBe('DIV');
    expect(trigger?.getAttribute('role')).toBeNull();
    expect(trigger?.getAttribute('aria-expanded')).toBeNull();
    expect(trigger?.getAttribute('aria-labelledby')).toBeNull();
    expect(triggerRef.current).toBe(trigger);
    expect(screen.getByText('Alpha').textContent).toBe('Alpha');
  });

  it('lays out a row of tags differently from an empty trigger', () => {
    const { rerender } = render(
      <VirtualSelectDivTrigger hasTags={false} triggerRef={createTriggerRef()}>
        <span>Alpha</span>
      </VirtualSelectDivTrigger>,
    );
    const emptyClassName = screen.getByRole('button').className;

    rerender(
      <VirtualSelectDivTrigger hasTags triggerRef={createTriggerRef()}>
        <span>Alpha</span>
      </VirtualSelectDivTrigger>,
    );

    expect(screen.getByRole('button').className).not.toBe(emptyClassName);
  });
});
