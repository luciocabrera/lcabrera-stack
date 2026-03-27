import type { FastifyPluginAsync } from "fastify";
import type { Pool } from "pg";

import type { EnvConfig } from "../../config/env.schema";
import { HttpError } from "../../errors/httpError";
import { delay } from "../../utils/delay.util";
import { createJsonFieldsParser } from "../../utils/parseJsonQueryFields.util";

import { createEnterpriseOrdersRepository } from "./enterpriseOrders.repository";
import {
  type DistinctColumnParams,
  type DistinctValuesQuery,
  type OrderByIdParams,
  type PaginatedEnterpriseOrdersQuery,
  distinctColumnParamsSchema,
  distinctValuesQuerySchema,
  orderByIdParamsSchema,
  paginatedEnterpriseOrdersQuerySchema,
} from "./enterpriseOrders.schema";

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

    fastify.addHook("preValidation", createJsonFieldsParser(["sort", "filter"]));

    fastify.get<{ Querystring: PaginatedEnterpriseOrdersQuery }>(
      "/paginated",
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

    fastify.get<{
      Params: DistinctColumnParams;
      Querystring: DistinctValuesQuery;
    }>(
      "/distinct/:columnName",
      {
        schema: {
          params: distinctColumnParamsSchema,
          querystring: distinctValuesQuerySchema,
        },
      },
      async (request) => {
        if (envConfig.DISTINCT_VALUES_DELAY_MS > 0) {
          await delay({
            milliseconds: envConfig.DISTINCT_VALUES_DELAY_MS,
          });
        }

        const { columnName } = request.params;
        const { limit, offset } = request.query;

        return repository.getDistinctValues({ columnName, limit, offset });
      },
    );

    fastify.get<{ Params: OrderByIdParams }>(
      "/:orderId",
      { schema: { params: orderByIdParamsSchema } },
      async (request) => {
        const orderId = Number.parseInt(request.params.orderId, 10);

        const result = await repository.getOrderById(orderId);

        if (!result) {
          throw new HttpError({
            message: "Order not found",
            statusCode: 404,
          });
        }

        return result;
      },
    );
  };
