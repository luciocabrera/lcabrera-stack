import type { FastifyPluginAsync } from 'fastify';
import type { Pool } from 'pg';

import { createJsonFieldsParser } from '../../utils/parseJsonQueryFields.util';

import { createWideAlltypes150Repository } from './wideAlltypes150.repository';
import {
  type PaginatedWideAlltypesQuery,
  paginatedWideAlltypesQuerySchema,
} from './wideAlltypes150.schema';

type CreateWideAlltypes150PluginArgs = {
  readonly pool: Pool;
};

/**
 * Fastify plugin for wide-alltypes endpoints.
 */
export const createWideAlltypes150Plugin =
  ({ pool }: CreateWideAlltypes150PluginArgs): FastifyPluginAsync =>
  async (fastify) => {
    const repository = createWideAlltypes150Repository({ pool });

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
