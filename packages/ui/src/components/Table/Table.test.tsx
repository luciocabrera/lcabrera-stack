// @vitest-environment jsdom
import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TableResponseError } from './Table.types';

import { Table } from './Table.component';

type MockTableContentProps = {
  readonly onLoadMore?: unknown;
};

type MockTableDataProviderProps = {
  readonly children: ReactNode;
  readonly dataState: {
    readonly data: readonly Record<string, unknown>[];
    readonly isLoading: boolean;
    readonly totalRows: number;
  };
};

const { useGetTablePersistenceKeyMock } = vi.hoisted(() => ({
  useGetTablePersistenceKeyMock: vi.fn(() => 'orders'),
}));

const MockTableContent = vi.hoisted(() => {
  return function MockTableContent({ onLoadMore }: MockTableContentProps) {
    return (
      <div
        data-has-load-more={String(Boolean(onLoadMore))}
        data-testid='content'
      />
    );
  };
});

const MockTableDataProvider = vi.hoisted(() => {
  return function MockTableDataProvider({
    children,
    dataState,
  }: MockTableDataProviderProps) {
    return (
      <div data-state={JSON.stringify(dataState)} data-testid='provider'>
        {children}
      </div>
    );
  };
});

vi.mock('./contexts', () => ({
  TableDataProvider: MockTableDataProvider,
}));

vi.mock('./contexts/TableConfig/meta/selectors', () => ({
  useGetTablePersistenceKey: useGetTablePersistenceKeyMock,
}));

vi.mock('./TableContent', () => ({
  TableContent: MockTableContent,
}));

afterEach(cleanup);

describe('Table', () => {
  it('maps response into provider state using selectors', () => {
    type Response = {
      readonly rows: { readonly id: number }[];
      readonly total: number;
    };

    render(
      <Table
        dataSelector={(response: Response) => [...response.rows]}
        dataTotalSelector={(response: Response) => response.total}
        isLoading
        response={{ rows: [{ id: 1 }], total: 999 }}
      />,
    );

    const provider = screen.getByTestId('provider');
    const state = JSON.parse(provider.dataset.state ?? '{}') as {
      data: readonly { id: number }[];
      isLoading: boolean;
      totalRows: number;
    };

    expect(state.data).toEqual([{ id: 1 }]);
    expect(state.isLoading).toBe(true);
    expect(state.totalRows).toBe(999);
    expect(screen.getByTestId('content').dataset.hasLoadMore).toBe('false');
  });

  it('seeds the read refusal into the data store, where a surface can read it', () => {
    // Without this the response's `error` reaches the client and nothing looks
    // at it, which is a refused grouping rendering as an ordinary empty table
    // (#642).
    type Response = {
      readonly data: readonly { readonly id: number }[];
      readonly error?: TableResponseError;
    };

    const response: Response = {
      data: [],
      error: {
        column: 'total_amount',
        kind: 'grouping-refused',
        message: 'Refused.',
        reason: 'column-not-groupable',
      },
    };

    render(
      <Table
        dataErrorSelector={(current: Response) => current.error}
        dataSelector={(current: Response) => current.data}
        response={response}
      />,
    );

    const provider = screen.getByTestId('provider');
    const state = JSON.parse(provider.dataset.state ?? '{}') as {
      error?: TableResponseError;
    };

    expect(state.error).toEqual({
      column: 'total_amount',
      kind: 'grouping-refused',
      message: 'Refused.',
      reason: 'column-not-groupable',
    });
  });

  it('leaves the store error unset when the table is wired without the selector', () => {
    type Response = { readonly data: readonly { readonly id: number }[] };

    render(
      <Table
        dataSelector={(response: Response) => response.data}
        response={{ data: [] }}
      />,
    );

    const provider = screen.getByTestId('provider');
    const state = JSON.parse(provider.dataset.state ?? '{}') as {
      error?: unknown;
    };

    expect(state.error).toBeUndefined();
  });

  it('renders without wrapper when flex wrapper is disabled', () => {
    type Response = {
      readonly rows: { readonly id: number }[];
    };

    const { container } = render(
      <Table
        dataSelector={(response: Response) => [...response.rows]}
        isFlexWrapperEnabled={false}
        response={{ rows: [{ id: 1 }] }}
      />,
    );

    const root = container.firstElementChild as HTMLElement | null;
    expect(root).not.toBeNull();
    expect(root?.dataset.testid).toBe('provider');
  });
});
