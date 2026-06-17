// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { VirtualListHeader } from './VirtualListHeader.component';

afterEach(() => {
  cleanup();
});

describe('VirtualListHeader', () => {
  it('renders the search input with the provided name and value', () => {
    render(
      <VirtualListHeader
        name='country-filter'
        onClearSearch={() => void 0}
        onSearchChange={() => void 0}
        searchTerm='Spa'
      />,
    );

    const input = screen.getByPlaceholderText('Search options...');
    expect(input.getAttribute('name')).toBe('country-filter');
    expect((input as HTMLInputElement).value).toBe('Spa');
  });

  it('does not render the clear button when search is empty', () => {
    render(
      <VirtualListHeader
        onClearSearch={() => void 0}
        onSearchChange={() => void 0}
        searchTerm=''
      />,
    );

    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });

  it('renders clear button and triggers clear callback when clicked', () => {
    const onClearSearch = vi.fn();

    render(
      <VirtualListHeader
        onClearSearch={onClearSearch}
        onSearchChange={() => void 0}
        searchTerm='Arg'
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onClearSearch).toHaveBeenCalledTimes(1);
  });

  it('forwards input changes to onSearchChange', () => {
    const onSearchChange = vi.fn();

    render(
      <VirtualListHeader
        onClearSearch={() => void 0}
        onSearchChange={onSearchChange}
        searchTerm=''
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('Search options...'), {
      target: { value: 'Bra' },
    });

    expect(onSearchChange).toHaveBeenCalledTimes(1);
  });
});
