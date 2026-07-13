// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  VirtualListConfigProvider,
  VirtualListDataProvider,
} from '../contexts';
import { VirtualListHeader } from './VirtualListHeader.component';

afterEach(cleanup);

type ProviderShellProps = {
  readonly children: ReactNode;
  readonly name?: string;
};

const ProviderShell = ({ children, name }: ProviderShellProps) => (
  <VirtualListConfigProvider
    hasCheckboxes
    hasSelectAll
    name={name}
    onChange={vi.fn()}
  >
    <VirtualListDataProvider
      dataState={{
        data: ['Alpha', 'Beta'],
        hasMore: false,
        isLoading: false,
        isLoadingMore: false,
      }}
    >
      {children}
    </VirtualListDataProvider>
  </VirtualListConfigProvider>
);

describe('VirtualListHeader', () => {
  it('renders the search input with the configured name', () => {
    render(
      <ProviderShell name='country-filter'>
        <VirtualListHeader />
      </ProviderShell>,
    );

    expect(
      screen.getByPlaceholderText<HTMLInputElement>('Search options...').name,
    ).toBe('country-filter');
  });

  it('updates the search term through its own action', () => {
    render(
      <ProviderShell>
        <VirtualListHeader />
      </ProviderShell>,
    );

    fireEvent.change(screen.getByPlaceholderText('Search options...'), {
      target: { value: 'Alp' },
    });

    expect(
      screen.getByPlaceholderText<HTMLInputElement>('Search options...').value,
    ).toBe('Alp');
  });

  it('shows the clear button only while a term is set and clears it on click', () => {
    render(
      <ProviderShell>
        <VirtualListHeader />
      </ProviderShell>,
    );

    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();

    fireEvent.change(screen.getByPlaceholderText('Search options...'), {
      target: { value: 'Alp' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(
      screen.getByPlaceholderText<HTMLInputElement>('Search options...').value,
    ).toBe('');
  });
});
