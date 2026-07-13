// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { contentRenderCount, metaState, setMetaState } = vi.hoisted(() => {
  const initialMetaState = {
    isAlwaysOpen: false,
    isListVisible: true,
    listboxId: 'listbox-id',
    shouldFillHeight: false,
  };
  const state = { current: { ...initialMetaState } };

  return {
    contentRenderCount: { current: 0 },
    metaState: state,
    setMetaState: (next: Partial<typeof initialMetaState>) => {
      state.current = { ...initialMetaState, ...next };
    },
  };
});

vi.mock('@repo/ui/components/VirtualList', () => ({
  VirtualListContent: () => {
    contentRenderCount.current += 1;
    return <div data-testid='virtual-list-content'>Virtual list content</div>;
  },
}));

vi.mock(
  '@repo/ui/components/VirtualList/contexts/VirtualListConfig/config/selectors',
  () => ({
    useGetShouldFillHeight: () => metaState.current.shouldFillHeight,
  }),
);

vi.mock('../contexts/VirtualSelectConfig/meta/selectors', () => ({
  useGetCustomStylex: () => undefined,
  useGetIsAlwaysOpen: () => metaState.current.isAlwaysOpen,
  useGetIsListVisible: () => metaState.current.isListVisible,
  useGetListboxId: () => metaState.current.listboxId,
}));

import { VirtualSelectDropdown } from './VirtualSelectDropdown.component';

beforeEach(() => {
  setMetaState({});
  contentRenderCount.current = 0;
});

afterEach(() => {
  cleanup();
});

describe('VirtualSelectDropdown', () => {
  it('renders nothing while the list is hidden', () => {
    setMetaState({ isListVisible: false });

    const { container } = render(<VirtualSelectDropdown />);

    expect(container.firstChild).toBeNull();
    expect(contentRenderCount.current).toBe(0);
  });

  it('renders the listbox shell around the provider-less list content', () => {
    render(<VirtualSelectDropdown />);

    const listbox = screen.getByRole('listbox');

    expect(listbox.id).toBe('listbox-id');
    expect(screen.getByTestId('virtual-list-content').textContent).toBe(
      'Virtual list content',
    );
  });

  it('keeps the listbox shell when positioned static and fill-height', () => {
    setMetaState({ isAlwaysOpen: true, shouldFillHeight: true });

    render(<VirtualSelectDropdown />);

    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(contentRenderCount.current).toBe(1);
  });
});
