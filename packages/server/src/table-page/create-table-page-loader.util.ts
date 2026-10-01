import type { OlapGroupRead } from '../db/olap/olap.types.ts';
import type { TablePageReader } from './create-table-page-reader.util.ts';

import { toRefusedTablePage } from './to-refused-table-page.util.ts';

export type CreateTablePageLoaderArgs = {
  readonly resolvePageRead: TablePageReader['resolvePageRead'];
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

    if (resolved.kind === 'refused') {
      return Response.json(toRefusedTablePage(resolved.message));
    }

    return Response.json(await selectPage(resolved.read));
  };
