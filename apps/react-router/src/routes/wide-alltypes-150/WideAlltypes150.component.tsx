import { useLoaderData } from 'react-router';

import type { WideAlltypes150, WideAlltypes150Response } from '@/services';

import { TableLayout } from '@/components/Table/TableLayout';
import { wideAlltypes150Api } from '@/services';

import type { loader } from './wide-alltypes-150.loader';

export const WideAlltypes150Page = () => {
  const { columnsState, dataPromise, metaState } =
    useLoaderData<typeof loader>();

  return (
    <TableLayout<WideAlltypes150, WideAlltypes150Response>
      columnsState={columnsState}
      dataPromise={dataPromise}
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.total}
      metaState={metaState}
      onLoadMore={async ({ limit, skip }) =>
        wideAlltypes150Api.fetchPaginated({
          // filter: columnsState?.columnFilters ?? {},
          limit,
          skip,
          sorting: columnsState?.sorting ?? [],
        })
      }
    />
  );
};
