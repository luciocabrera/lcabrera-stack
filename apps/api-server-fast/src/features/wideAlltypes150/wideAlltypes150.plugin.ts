import type { FastifyPluginAsync } from 'fastify';

import { createJsonFieldsParser } from '../../utils/parseJsonQueryFields.util';
import { createWideAlltypes150Repository } from './wideAlltypes150.repository';
import {
  type PaginatedWideAlltypesQuery,
  paginatedWideAlltypesQuerySchema,
} from './wideAlltypes150.schema';

/**
 * Fastify plugin for wide-alltypes endpoints.
 */
export const createWideAlltypes150Plugin = (): FastifyPluginAsync => {
  const repository = createWideAlltypes150Repository();

  return async (fastify) => {
    fastify.addHook('preValidation', createJsonFieldsParser(['sort']));

    fastify.get<{ Querystring: PaginatedWideAlltypesQuery }>(
      '/paginated',
      { schema: { querystring: paginatedWideAlltypesQuerySchema } },
      async (request) => {
        const { limit, skip, sort } = request.query;
        return repository.getPaginated({ limit, skip, sorting: sort });
      },
    );
  };
};
