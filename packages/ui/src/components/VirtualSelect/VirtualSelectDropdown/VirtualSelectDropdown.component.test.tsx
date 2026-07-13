// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getLatestContentProps,
  metaState,
  setLatestContentProps,
  setMetaState,
} = vi.hoisted(() => {
  const initialMetaState = {
    isAlwaysOpen: false,
    isListVisible: true,
    listboxId: 'listbox-id',
    listMaxHeight: '18.75rem',
    shouldFillHeight: false,
  };
  const state = { current: { ...initialMetaState } };

  let latestContentProps:
    | undefined
    | {
        readonly listMaxHeight?: string;
        readonly shouldFillHeight?: boolean;
      };

  return {
    getLatestContentProps: () => latestContentProps,
    metaState: state,
    setLatestContentProps: (props: typeof latestContentProps | undefined) => {
      latestContentProps = props;
    },
    setMetaState: (next: Partial<typeof initialMetaState>) => {
      state.current = { ...initialMetaState, ...next };
    },
  };
});

vi.mock('@repo/ui/components/VirtualList', () => ({
  VirtualListContent: (
    props: NonNullable<Parameters<typeof setLatestContentProps>[0]>,
  ) => {
    setLatestContentProps(props);
    return <div data-testid='virtual-list-content'>Virtual list content</div>;
  },
}));

vi.mock('../contexts/VirtualSelectConfig/meta/selectors', () => ({
  useGetCustomStylex: () => undefined,
  useGetIsAlwaysOpen: () => metaState.current.isAlwaysOpen,
  useGetIsListVisible: () => metaState.current.isListVisible,
  useGetListboxId: () => metaState.current.listboxId,
  useGetListMaxHeight: () => metaState.current.listMaxHeight,
  useGetShouldFillHeight: () => metaState.current.shouldFillHeight,
}));

import { VirtualSelectDropdown } from './VirtualSelectDropdown.component';

beforeEach(() => {
  setMetaState({});
});

afterEach(() => {
  setLatestContentProps(undefined);
  cleanup();
});

describe('VirtualSelectDropdown', () => {
  it('renders nothing while the list is hidden', () => {
    setMetaState({ isListVisible: false });

    const { container } = render(<VirtualSelectDropdown />);

    expect(container.firstChild).toBeNull();
    expect(getLatestContentProps()).toBeUndefined();
  });

  it('renders the listbox shell around the provider-less list content', () => {
    render(<VirtualSelectDropdown />);

    const listbox = screen.getByRole('listbox');

    expect(listbox.id).toBe('listbox-id');
    expect(screen.getByTestId('virtual-list-content').textContent).toBe(
      'Virtual list content',
    );
    expect(getLatestContentProps()).toEqual({
      listMaxHeight: '18.75rem',
      shouldFillHeight: false,
    });
  });

  it('forwards the fill-height layout to the list content', () => {
    setMetaState({ isAlwaysOpen: true, shouldFillHeight: true });

    render(<VirtualSelectDropdown />);

    expect(getLatestContentProps()).toEqual({
      listMaxHeight: '18.75rem',
      shouldFillHeight: true,
    });
  });
});
