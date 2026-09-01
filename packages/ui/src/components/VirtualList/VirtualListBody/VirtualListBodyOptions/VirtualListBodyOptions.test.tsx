// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { VirtualListBodyOptionsProps } from './VirtualListBodyOptions.types';

import { VirtualListProvider } from '../../contexts';
import { VirtualListBodyOptions } from './VirtualListBodyOptions.component';

afterEach(cleanup);

type ProviderShellProps = {
  readonly children: ReactNode;
  readonly onChange?: (filter?: unknown) => void;
  readonly selectedValues?: readonly string[];
};

const ProviderShell = ({
  children,
  onChange = vi.fn(),
  selectedValues = [],
}: ProviderShellProps) => (
  <VirtualListProvider
    dataState={{
      data: ['Alpha', 'Beta', 'Gamma'],
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
    }}
    filter={{ type: 'select', values: selectedValues }}
    listState={{ hasCheckboxes: true, hasSelectAll: true, onChange }}
  >
    {children}
  </VirtualListProvider>
);

const fullWindowProps: VirtualListBodyOptionsProps = {
  endIndex: 4,
  offsetY: 0,
  startIndex: 0,
  totalHeight: 128,
};

describe('VirtualListBodyOptions', () => {
  it('renders the select-all row and every option inside the window', () => {
    render(
      <ProviderShell>
        <VirtualListBodyOptions {...fullWindowProps} />
      </ProviderShell>,
    );

    expect(screen.getByText('Select All')).toBeTruthy();
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();
    expect(screen.getByText('Gamma')).toBeTruthy();
  });

  it('renders only the rows between startIndex and endIndex', () => {
    render(
      <ProviderShell>
        <VirtualListBodyOptions
          {...fullWindowProps}
          endIndex={3}
          startIndex={1}
        />
      </ProviderShell>,
    );

    expect(screen.queryByText('Select All')).toBeNull();
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();
    expect(screen.queryByText('Gamma')).toBeNull();
  });

  it('emits a select-all filter through onChange', () => {
    const onChange = vi.fn();

    render(
      <ProviderShell onChange={onChange}>
        <VirtualListBodyOptions {...fullWindowProps} />
      </ProviderShell>,
    );

    fireEvent.click(screen.getByText('Select All'));

    expect(onChange).toHaveBeenCalledWith({
      type: 'select',
      values: ['Alpha', 'Beta', 'Gamma'],
    });
  });

  it('emits a deselect-all filter when every option is selected', () => {
    const onChange = vi.fn();

    render(
      <ProviderShell
        onChange={onChange}
        selectedValues={['Alpha', 'Beta', 'Gamma']}
      >
        <VirtualListBodyOptions {...fullWindowProps} />
      </ProviderShell>,
    );

    fireEvent.click(screen.getByText('Deselect All'));

    expect(onChange).toHaveBeenCalledWith({ type: 'select', values: [] });
  });

  it('renders nothing for an empty window', () => {
    render(
      <ProviderShell>
        <VirtualListBodyOptions
          {...fullWindowProps}
          endIndex={0}
          totalHeight={0}
        />
      </ProviderShell>,
    );

    expect(screen.queryByText('Select All')).toBeNull();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });
});
