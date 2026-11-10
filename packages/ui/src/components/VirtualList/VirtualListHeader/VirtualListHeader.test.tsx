// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { VirtualListProvider } from '../contexts';
import { useSetIsTopAttached } from '../contexts/list/actions';
import { VirtualListHeader } from './VirtualListHeader.component';

afterEach(cleanup);

type ProviderShellProps = {
  readonly children: ReactNode;
  readonly name?: string;
};

const ProviderShell = ({ children, name }: ProviderShellProps) => (
  <VirtualListProvider
    dataState={{
      data: ['Alpha', 'Beta'],
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
    }}
    listState={{
      hasCheckboxes: true,
      hasSelectAll: true,
      name,
      onChange: vi.fn(),
    }}
  >
    {children}
  </VirtualListProvider>
);

const AttachButton = () => {
  const setIsTopAttached = useSetIsTopAttached();

  return (
    <button
      onClick={() => {
        setIsTopAttached(true);
      }}
      type='button'
    >
      attach
    </button>
  );
};

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

  it('squares its top corners once a control is attached on top of the list', () => {
    render(
      <ProviderShell>
        <AttachButton />
        <VirtualListHeader />
      </ProviderShell>,
    );
    const input = screen.getByPlaceholderText('Search options...');
    const detachedClassName = input.className;

    fireEvent.click(screen.getByRole('button', { name: 'attach' }));

    expect(input.className).not.toBe(detachedClassName);
  });
});
