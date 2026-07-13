// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { getLatestContentProps, setLatestContentProps } = vi.hoisted(() => {
  let latestContentProps:
    | undefined
    | {
        readonly listMaxHeight?: string;
        readonly shouldFillHeight?: boolean;
      };

  return {
    getLatestContentProps: () => latestContentProps,
    setLatestContentProps: (props: typeof latestContentProps | undefined) => {
      latestContentProps = props;
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

import { VirtualSelectDropdown } from './VirtualSelectDropdown.component';

const createProps = () => ({
  isAlwaysOpen: false,
  isListVisible: true,
  listboxId: 'listbox-id',
  listMaxHeight: '18.75rem',
  shouldFillHeight: false,
});

afterEach(() => {
  setLatestContentProps(undefined);
  cleanup();
});

describe('VirtualSelectDropdown', () => {
  it('renders nothing while the list is hidden', () => {
    const props = { ...createProps(), isListVisible: false };

    const { container } = render(<VirtualSelectDropdown {...props} />);

    expect(container.firstChild).toBeNull();
    expect(getLatestContentProps()).toBeUndefined();
  });

  it('renders the listbox shell around the provider-less list content', () => {
    render(<VirtualSelectDropdown {...createProps()} />);

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
    render(
      <VirtualSelectDropdown
        {...createProps()}
        isAlwaysOpen
        shouldFillHeight
      />,
    );

    expect(getLatestContentProps()).toEqual({
      listMaxHeight: '18.75rem',
      shouldFillHeight: true,
    });
  });
});
