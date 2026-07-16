import type { FastifyPluginAsync } from 'fastify';
import type { Pool } from 'pg';

import { HttpError } from 'api-shared';

import type { EnvConfig } from '../../config/env.schema';

import { delay } from '../../utils/delay.util';
import { createJsonFieldsParser } from '../../utils/parseJsonQueryFields.util';
import { createEnterpriseOrdersRepository } from './enterpriseOrders.repository';
import {
  type OrderByIdParams,
  orderByIdParamsSchema,
  type PaginatedEnterpriseOrdersQuery,
  paginatedEnterpriseOrdersQuerySchema,
} from './enterpriseOrders.schema';

type CreateEnterpriseOrdersPluginArgs = {
  readonly envConfig: EnvConfig;
  readonly pool: Pool;
};

/**
 * Fastify plugin for enterprise-order endpoints.
 */
export const createEnterpriseOrdersPlugin =
  ({ envConfig, pool }: CreateEnterpriseOrdersPluginArgs): FastifyPluginAsync =>
  async (fastify) => {
    const repository = createEnterpriseOrdersRepository({ pool });

    fastify.addHook(
      'preValidation',
      createJsonFieldsParser(['sort', 'filter']),
    );

    fastify.get<{ Querystring: PaginatedEnterpriseOrdersQuery }>(
      '/paginated',
      { schema: { querystring: paginatedEnterpriseOrdersQuerySchema } },
      async (request) => {
        if (envConfig.ENTERPRISE_ORDERS_DELAY_MS > 0) {
          await delay({
            milliseconds: envConfig.ENTERPRISE_ORDERS_DELAY_MS,
          });
        }

        const { filter, limit, skip, sort } = request.query;

        return repository.getPaginated({
          filters: filter,
          limit,
          skip,
          sorting: sort,
        });
      },
    );

    fastify.get<{ Params: OrderByIdParams }>(
      '/:orderId',
      { schema: { params: orderByIdParamsSchema } },
      async (request) => {
        const orderId = Number.parseInt(request.params.orderId, 10);

        const result = await repository.getOrderById(orderId);

        if (!result) {
          throw new HttpError({
            message: 'Order not found',
            statusCode: 404,
          });
        }

        return result;
      },
    );
  };
