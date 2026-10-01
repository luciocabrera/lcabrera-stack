// @vitest-environment jsdom

import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table';

import { createEmptyColumnsState } from '#ui/components/Table/utils/createEmptyColumnsState.util';

import { TableLayout } from './TableLayout.component';

type Append = (rows: readonly { readonly id: number }[]) => void;

type Page = { readonly data: readonly Row[]; readonly total: number };

type Row = { readonly id: number };

const store = vi.hoisted(() => ({ append: undefined as Append | undefined }));

vi.mock('#ui/components/Table/TableContent', async () => {
  const { useGetTableData } =
    await import('#ui/components/Table/contexts/TableData/data/selectors/useGetTableData.hook');
  const { useTableDataContextValue } =
    await import('#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook');

  return {
    TableContent: () => {
      const { dataStore } = useTableDataContextValue<Row>();
      const data = useGetTableData<Row>();

      store.append = (rows) => {
        const { data: loaded } = dataStore.get();
        dataStore.set({ data: [...loaded, ...rows] });
      };

      return <output data-testid='loaded-rows'>{data.length}</output>;
    },
  };
});

vi.mock('#ui/components/Table/TableSkeleton', () => ({
  TableSkeleton: () => <p>Loading</p>,
}));

afterEach(cleanup);

const columns: TableColumn<Row>[] = [
  { dataType: 'number', isPrimaryKey: true, key: 'id', label: 'ID' },
];

const FIRST_PAGE: Page = { data: [{ id: 1 }], total: 3 };

const dataPromise = Promise.resolve(FIRST_PAGE);

const RouteView = () => {
  useLocation();

  return (
    <TableLayout<Row, Page>
      columnsState={createEmptyColumnsState({ columns })}
      dataPromise={dataPromise}
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.total}
      metaState={{
        persistenceKey: 'rows',
        title: { plural: 'Rows', singular: 'Row' },
      }}
    />
  );
};

const renderLayout = async () => {
  const router = createMemoryRouter([{ element: <RouteView />, path: '/' }]);

  await act(async () => {
    render(<RouterProvider router={router} />);
    await dataPromise;
  });

  return router;
};

describe('TableLayout', () => {
  it('keeps the pages it loaded when the route re-renders with the same response', async () => {
    const router = await renderLayout();

    await waitFor(() => {
      expect(screen.getByTestId('loaded-rows').textContent).toBe('1');
    });

    act(() => {
      store.append?.([{ id: 2 }, { id: 3 }]);
    });

    expect(screen.getByTestId('loaded-rows').textContent).toBe('3');

    await act(async () => {
      await router.navigate('/?unrelated=1');
    });

    expect(screen.getByTestId('loaded-rows').textContent).toBe('3');
  });
});
