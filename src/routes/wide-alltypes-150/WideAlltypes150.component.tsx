import { useLoaderData } from 'react-router';

import type { WideAlltypes150, WideAlltypes150Response } from '@/services';

import { TableLayout } from '@/components/Table/TableLayout';
import { wideAlltypes150Api } from '@/services';

import type { loader } from './wide-alltypes-150.loader';

import { COLUMNS, PERSISTENCE_KEY } from './WideAlltypes150.constants';

export const WideAlltypes150Page = () => {
  const {
    columnOrder,
    columnSizing,
    columnVisibility,
    dataPromise,
    key,
    sorting,
  } = useLoaderData<typeof loader>();

  return (
    <TableLayout<WideAlltypes150, WideAlltypes150Response>
      columnOrder={columnOrder}
      columns={COLUMNS}
      columnSizing={columnSizing}
      columnVisibility={columnVisibility}
      dataPromise={dataPromise}
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.total}
      onLoadMore={({ limit, skip }) =>
        wideAlltypes150Api.fetchPaginated({ limit, skip, sorting })
      }
      persistenceKey={PERSISTENCE_KEY}
      sorting={sorting}
      suspenseKey={key}
      title='Wide All-Types — 150 Columns × 1M Rows'
    />
  );
};
