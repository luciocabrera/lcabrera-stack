import { TableLayout } from '@lcabrera/ui/components/Table/TableLayout';
import { appendPrimaryKeySorting } from '@lcabrera/ui/routing/shared/appendPrimaryKeySorting.util';
import { sanitizeSorting } from '@lcabrera/ui/routing/shared/sanitizeSorting.util';
import { useLoaderData } from 'react-router';

import type { WideAlltypes150, WideAlltypes150Response } from '@/services';

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
          limit,
          skip,
          sorting: appendPrimaryKeySorting<WideAlltypes150>({
            columns: columnsState.columns,
            sorting: sanitizeSorting<WideAlltypes150>(
              columnsState?.sorting ?? [],
            ),
          }),
        })
      }
    />
  );
};
