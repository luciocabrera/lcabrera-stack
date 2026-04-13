import type { RequestHandler } from 'express';

import { DEFAULT_PAGE_LIMIT } from '../../constants/server.constants';
import { createRequestHandler } from '../../utils/createRequestHandler.util';
import { readQueryInteger } from '../../utils/readQueryInteger.util';

import { CAR_SALES_SORTABLE_COLUMNS } from './carSales.constants';
import type { CarSalesRepository } from './carSales.repository';
import { parseCarSalesSorting } from './carSales.schema';

export type CarSalesController = {
  readonly getAll: RequestHandler;
  readonly getPaginated: RequestHandler;
};

type CreateCarSalesControllerArgs = {
  readonly repository: CarSalesRepository;
};

/**
 * HTTP handlers for car sales endpoints.
 */
export const createCarSalesController = ({
  repository,
}: CreateCarSalesControllerArgs): CarSalesController => ({
  getAll: createRequestHandler({
    handler: async ({ response }) => {
      console.warn('📊 [All] Fetching all car sales');
      const result = await repository.getAll();
      response.json(result);
    },
  }),
  getPaginated: createRequestHandler({
    handler: async ({ request, response }) => {
      const skip = readQueryInteger({
        fallback: 0,
        value: request.query.skip,
      });
      const limit = readQueryInteger({
        fallback: DEFAULT_PAGE_LIMIT,
        min: 1,
        value: request.query.limit,
      });
      const sorting = parseCarSalesSorting({
        allowedColumns: CAR_SALES_SORTABLE_COLUMNS,
        value: request.query.sort,
      });

      console.warn('📊 [Paginated] Fetching car sales', {
        limit,
        skip,
        sorting,
      });

      const result = await repository.getPaginated({ limit, skip, sorting });
      response.json(result);
    },
  }),
});
