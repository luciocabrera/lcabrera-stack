import type { RequestHandler } from 'express';

import { DEFAULT_PAGE_LIMIT, MAX_WIDE_ALLTYPES_LIMIT } from 'api-shared';

import type { WideAlltypes150Repository } from './wideAlltypes150.repository';

import { createRequestHandler } from '../../utils/createRequestHandler.util';
import { readQueryInteger } from '../../utils/readQueryInteger.util';
import { WIDE_ALLTYPES_SORTABLE_COLUMNS } from './wideAlltypes150.constants';
import { parseWideAlltypesSorting } from './wideAlltypes150.schema';

export type WideAlltypes150Controller = {
  readonly getPaginated: RequestHandler;
};

type CreateWideAlltypes150ControllerArgs = {
  readonly repository: WideAlltypes150Repository;
};

/**
 * HTTP handlers for wide-alltypes endpoints.
 */
export const createWideAlltypes150Controller = ({
  repository,
}: CreateWideAlltypes150ControllerArgs): WideAlltypes150Controller => ({
  getPaginated: createRequestHandler({
    handler: async ({ request, response }) => {
      const skip = readQueryInteger({
        fallback: 0,
        value: request.query.skip,
      });
      const limit = readQueryInteger({
        fallback: DEFAULT_PAGE_LIMIT,
        max: MAX_WIDE_ALLTYPES_LIMIT,
        min: 1,
        value: request.query.limit,
      });
      const sorting = parseWideAlltypesSorting({
        allowedColumns: WIDE_ALLTYPES_SORTABLE_COLUMNS,
        value: request.query.sort,
      });

      const result = await repository.getPaginated({ limit, skip, sorting });
      response.json(result);
    },
  }),
});
