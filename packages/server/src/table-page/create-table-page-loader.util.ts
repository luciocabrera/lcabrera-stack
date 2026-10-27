import type { OlapGroupRead } from '../db/olap/olap.types.ts';
import type { TablePageReadResolution } from './table-page.types.ts';

import { toRefusedTablePage } from './to-refused-table-page.util.ts';

export type CreateTablePageLoaderArgs = {
  readonly resolvePageRead: (
    params: URLSearchParams,
  ) => Promise<TablePageReadResolution>;
  readonly selectPage: (read: OlapGroupRead) => Promise<unknown>;
};

export type TablePageLoader = (args: TablePageLoaderArgs) => Promise<Response>;

export type TablePageLoaderArgs = {
  readonly request: Request;
};

export const createTablePageLoader =
  ({
    resolvePageRead,
    selectPage,
  }: CreateTablePageLoaderArgs): TablePageLoader =>
  async ({ request }: TablePageLoaderArgs) => {
    const resolved = await resolvePageRead(new URL(request.url).searchParams);

    return Response.json(
      resolved.kind === 'refused'
        ? toRefusedTablePage(resolved.message)
        : await selectPage(resolved.read),
    );
  };
