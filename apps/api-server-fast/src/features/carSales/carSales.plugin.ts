import type { FastifyPluginAsync } from 'fastify';

import type { PaginatedCarSalesQuery } from './carSales.schema';

import { createJsonFieldsParser } from '../../utils/parseJsonQueryFields.util';
import { createCarSalesRepository } from './carSales.repository';
import { paginatedCarSalesQuerySchema } from './carSales.schema';

/**
 * Fastify plugin for car sales endpoints.
 */
export const createCarSalesPlugin = (): FastifyPluginAsync => {
  const repository = createCarSalesRepository();

  return async (fastify) => {
    fastify.addHook('preValidation', createJsonFieldsParser(['sort']));

    fastify.get('/', async () => {
      console.warn('📊 [All] Fetching all car sales');
      return repository.getAll();
    });

    fastify.get<{ Querystring: PaginatedCarSalesQuery }>(
      '/paginated',
      { schema: { querystring: paginatedCarSalesQuerySchema } },
      async (request) => {
        const { limit, skip, sort } = request.query;

        console.warn('📊 [Paginated] Fetching car sales', {
          limit,
          skip,
          sorting: sort,
        });

        return repository.getPaginated({ limit, skip, sorting: sort });
      },
    );
  };
};
