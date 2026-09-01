import type { LoaderFunctionArgs } from 'react-router';

import { parseFilterOptionsParams } from '@lcabrera/api/distinct/parse-filter-options-params.util';
import { DEFAULT_FILTER_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';

import { selectDistinctFilterOptions } from './.server/distinct.service';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const params = parseFilterOptionsParams({
    defaultPageSize: DEFAULT_FILTER_PAGE_SIZE,
    searchParams: url.searchParams,
  });

  if (!params) {
    return Response.json(
      { error: 'Missing schemaName, tableName, or columnName' },
      { status: 400 },
    );
  }

  const page = await selectDistinctFilterOptions(params);

  if (!page) {
    return Response.json(
      { error: 'Unsupported distinct source or column' },
      { status: 400 },
    );
  }

  return Response.json(page);
};
