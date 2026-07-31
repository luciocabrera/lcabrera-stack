import type { FastifyPluginAsync } from 'fastify';

import type { EnvConfig } from '../../config/env.schema';
import type { DistinctQuery } from './distinct.schema';

import { delay } from '../../utils/delay.util';
import { createDistinctRepository } from './distinct.repository';
import { distinctQuerySchema } from './distinct.schema';

type CreateDistinctPluginArgs = {
  readonly envConfig: EnvConfig;
};

/**
 * Fastify plugin for the generic distinct-values endpoint
 * (`GET /api/distinct?schemaName&tableName&columnName&limit&offset`).
 * Source authorization happens in the repository via parseDistinctSource
 * (allow-list, 400 on unknown source/column).
 */
export const createDistinctPlugin =
  ({ envConfig }: CreateDistinctPluginArgs): FastifyPluginAsync =>
  async (fastify) => {
    const repository = createDistinctRepository();

    fastify.get<{ Querystring: DistinctQuery }>(
      '/',
      { schema: { querystring: distinctQuerySchema } },
      async (request) => {
        if (envConfig.DISTINCT_VALUES_DELAY_MS > 0) {
          await delay({
            milliseconds: envConfig.DISTINCT_VALUES_DELAY_MS,
          });
        }

        const { columnName, limit, offset, schemaName, tableName } =
          request.query;

        return repository.getDistinctValues({
          columnName,
          limit,
          offset,
          schemaName,
          tableName,
        });
      },
    );
  };
