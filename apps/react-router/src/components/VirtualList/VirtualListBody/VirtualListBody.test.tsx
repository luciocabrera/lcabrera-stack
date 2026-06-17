// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { VirtualListBody } from './VirtualListBody.component';

afterEach(() => {
  cleanup();
});

const baseProps = {
  containerHeight: 300,
  endIndex: 2,
  filteredOptions: ['Argentina', 'Brazil'],
  hasCheckboxes: true,
  isAllSelected: false,
  isInitialLoading: false,
  isLoadingOptions: false,
  listMaxHeight: '18.75rem',
  offsetY: 0,
  onSelectAll: vi.fn(),
  onToggle: vi.fn(),
  scrollContainerRef: { current: null },
  selectedValues: [],
  shouldFillHeight: false,
  shouldShowSelectAll: true,
  startIndex: 0,
  totalHeight: 96,
};

describe('VirtualListBody', () => {
  it('renders loading skeleton during initial loading', () => {
    const { container } = render(
      <VirtualListBody
        {...baseProps}
        filteredOptions={[]}
        isInitialLoading
        shouldShowSelectAll={false}
      />,
    );

    expect(container.firstChild).not.toBeNull();
  });

  it('renders empty state when there are no options', () => {
    render(
      <VirtualListBody
        {...baseProps}
        filteredOptions={[]}
        shouldShowSelectAll={false}
      />,
    );

    expect(screen.getByText('No options found')).toBeTruthy();
  });

  it('renders virtualized options when data exists', () => {
    render(<VirtualListBody {...baseProps} />);

    expect(screen.getByText('Select All')).toBeTruthy();
    expect(screen.getByText('Argentina')).toBeTruthy();
  });
});
