// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { VirtualListBodyOptions } from './VirtualListBodyOptions.component';

afterEach(() => {
  cleanup();
});

const baseProps = {
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

describe('VirtualListBodyOptions', () => {
  it('renders a visible row for each item in the virtualized window', () => {
    render(<VirtualListBodyOptions {...baseProps} />);

    expect(screen.getByText('Argentina')).toBeTruthy();
    expect(screen.getByText('Brazil')).toBeTruthy();
    expect(screen.getByText('Chile')).toBeTruthy();
  });

  it('renders only the rows within the startIndex–endIndex window', () => {
    render(
      <VirtualListBodyOptions {...baseProps} endIndex={2} startIndex={1} />,
    );

    expect(screen.queryByText('Argentina')).toBeNull();
    expect(screen.getByText('Brazil')).toBeTruthy();
    expect(screen.queryByText('Chile')).toBeNull();
  });

  it('renders "Select All" row at index 0 when shouldShowSelectAll is true', () => {
    render(
      <VirtualListBodyOptions
        {...baseProps}
        endIndex={4}
        filteredOptions={['Argentina', 'Brazil', 'Chile']}
        shouldShowSelectAll
        totalHeight={128}
      />,
    );

    expect(screen.getByText('Select All')).toBeTruthy();
  });

  it('renders "Deselect All" when shouldShowSelectAll is true and isAllSelected is true', () => {
    render(
      <VirtualListBodyOptions
        {...baseProps}
        endIndex={4}
        filteredOptions={['Argentina', 'Brazil', 'Chile']}
        isAllSelected
        selectedValues={['Argentina', 'Brazil', 'Chile']}
        shouldShowSelectAll
        totalHeight={128}
      />,
    );

    expect(screen.getByText('Deselect All')).toBeTruthy();
  });

  it('calls onChange with the toggled option added to selection', () => {
    const onChange = vi.fn();

    render(<VirtualListBodyOptions {...baseProps} onChange={onChange} />);

    const checkboxes = screen.getAllByRole('checkbox');
    const firstCheckbox = checkboxes[0];
    if (!firstCheckbox) throw new Error('Expected at least one checkbox');

    fireEvent.click(firstCheckbox);

    expect(onChange).toHaveBeenCalledWith({
      type: 'select',
      values: ['Argentina'],
    });
  });

  it('calls onChange with all options when Select All is clicked', () => {
    const onChange = vi.fn();

    render(
      <VirtualListBodyOptions
        {...baseProps}
        endIndex={4}
        filteredOptions={['Argentina', 'Brazil', 'Chile']}
        onChange={onChange}
        shouldShowSelectAll
        totalHeight={128}
      />,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    const firstCheckbox = checkboxes[0];
    if (!firstCheckbox) throw new Error('Expected at least one checkbox');

    fireEvent.click(firstCheckbox);

    expect(onChange).toHaveBeenCalledWith({
      type: 'select',
      values: ['Argentina', 'Brazil', 'Chile'],
    });
  });

  it('renders no rows when startIndex equals endIndex', () => {
    const { container } = render(
      <VirtualListBodyOptions {...baseProps} endIndex={0} startIndex={0} />,
    );

    const checkboxes = container.querySelectorAll('[role="checkbox"]');
    expect(checkboxes).toHaveLength(0);
  });
});
