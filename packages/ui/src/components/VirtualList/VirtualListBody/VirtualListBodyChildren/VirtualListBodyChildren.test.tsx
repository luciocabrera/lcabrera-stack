// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ITEM_HEIGHT } from '../../VirtualList.constants';
import { VirtualListBodyChildren } from './VirtualListBodyChildren.component';

afterEach(() => {
  cleanup();
});

const baseProps = {
  containerHeight: ITEM_HEIGHT * 3,
  contentMode: 'list' as const,
  endIndex: 3,
  filteredOptions: ['Argentina', 'Brazil', 'Chile'],
  hasCheckboxes: true,
  isAllSelected: false,
  isLoadingOptions: false,
  offsetY: 0,
  onChange: vi.fn(),
  selectedValues: [] as readonly string[],
  shouldShowSelectAll: false,
  startIndex: 0,
  totalHeight: 96,
};

describe('VirtualListBodyChildren', () => {
  it('renders skeleton placeholders sized to containerHeight in loading mode', () => {
    const { container } = render(
      <VirtualListBodyChildren {...baseProps} contentMode='loading' />,
    );

    expect(container.children.length).toBe(3);
    expect(screen.queryByText('Argentina')).toBeNull();
  });

  it('renders the empty-state message in empty mode', () => {
    render(
      <VirtualListBodyChildren
        {...baseProps}
        contentMode='empty'
        filteredOptions={[]}
        totalHeight={0}
      />,
    );

    expect(screen.getByText('No options found')).toBeTruthy();
  });

  it('renders the virtualized options in list mode', () => {
    render(<VirtualListBodyChildren {...baseProps} />);

    expect(screen.getByText('Argentina')).toBeTruthy();
    expect(screen.getByText('Brazil')).toBeTruthy();
    expect(screen.getByText('Chile')).toBeTruthy();
    expect(screen.queryByText('No options found')).toBeNull();
  });

  it('renders the select-all row in list mode when shouldShowSelectAll is true', () => {
    render(
      <VirtualListBodyChildren
        {...baseProps}
        endIndex={4}
        shouldShowSelectAll
        totalHeight={128}
      />,
    );

    expect(screen.getByText('Select All')).toBeTruthy();
  });

  it('forwards onChange to option toggles in list mode', () => {
    const onChange = vi.fn();

    render(<VirtualListBodyChildren {...baseProps} onChange={onChange} />);

    const checkboxes = screen.getAllByRole('checkbox');
    const firstCheckbox = checkboxes[0];
    if (!firstCheckbox) throw new Error('Expected at least one checkbox');

    fireEvent.click(firstCheckbox);

    expect(onChange).toHaveBeenCalledWith({
      type: 'select',
      values: ['Argentina'],
    });
  });
});
