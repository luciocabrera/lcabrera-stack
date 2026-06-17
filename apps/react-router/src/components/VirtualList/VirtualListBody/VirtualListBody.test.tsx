// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { VirtualListBody } from './VirtualListBody.component';

afterEach(() => {
  cleanup();
});

const baseProps = {
  dataState: {
    data: ['Argentina', 'Brazil'],
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
  },
  hasCheckboxes: true,
  hasSelectAll: true,
  listFilterMode: 'all' as const,
  listMaxHeight: '18.75rem',
  onChange: vi.fn(),
  searchTerm: '',
  selectedValues: [],
  shouldFillHeight: false,
};

describe('VirtualListBody', () => {
  it('renders loading skeleton during initial loading bootstrap', () => {
    const onFetchInitial = vi.fn();
    const { container } = render(
      <VirtualListBody
        {...baseProps}
        dataState={{
          data: [],
          hasMore: false,
          isLoading: false,
          isLoadingMore: false,
        }}
        onFetchInitial={onFetchInitial}
      />,
    );

    expect(container.firstChild).not.toBeNull();
    expect(onFetchInitial).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when there are no options', () => {
    render(
      <VirtualListBody
        {...baseProps}
        dataState={{
          data: [],
          hasMore: false,
          isLoading: false,
          isLoadingMore: false,
        }}
      />,
    );

    expect(screen.getByText('No options found')).toBeTruthy();
  });

  it('renders virtualized options when data exists', () => {
    render(<VirtualListBody {...baseProps} />);

    expect(screen.getByText('Select All')).toBeTruthy();
    expect(screen.getByText('Argentina')).toBeTruthy();
  });

  it('triggers onChange when an option is toggled', () => {
    const onChange = vi.fn();

    render(
      <VirtualListBody
        {...baseProps}
        hasSelectAll={false}
        onChange={onChange}
      />,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    const firstCheckbox = checkboxes[0];
    if (!firstCheckbox) {
      throw new Error('Expected at least one checkbox');
    }
    fireEvent.click(firstCheckbox);

    expect(onChange).toHaveBeenCalledWith({
      type: 'select',
      values: ['Argentina'],
    });
  });
});
