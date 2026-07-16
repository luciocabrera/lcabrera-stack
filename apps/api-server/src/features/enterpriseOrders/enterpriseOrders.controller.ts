import type { RequestHandler } from 'express';

import {
  DEFAULT_PAGE_LIMIT,
  ENTERPRISE_ORDER_ALLOWED_COLUMNS,
  HttpError,
} from 'api-shared';

import type { EnterpriseOrdersRepository } from './enterpriseOrders.repository';

import { createRequestHandler } from '../../utils/createRequestHandler.util';
import { delay } from '../../utils/delay.util';
import { readQueryInteger } from '../../utils/readQueryInteger.util';
import { readQueryValue } from '../../utils/readQueryValue.util';
import {
  parseEnterpriseOrdersFilters,
  parseEnterpriseOrdersSorting,
} from './enterpriseOrders.schema';

export type EnterpriseOrdersController = {
  readonly getOrderById: RequestHandler;
  readonly getPaginated: RequestHandler;
};

type CreateEnterpriseOrdersControllerArgs = {
  readonly enterpriseOrdersDelayMs: number;
  readonly repository: EnterpriseOrdersRepository;
};

/**
 * HTTP handlers for enterprise-order endpoints.
 */
export const createEnterpriseOrdersController = ({
  enterpriseOrdersDelayMs,
  repository,
}: CreateEnterpriseOrdersControllerArgs): EnterpriseOrdersController => ({
  getOrderById: createRequestHandler({
    handler: async ({ request, response }) => {
      const orderIdParam = readQueryValue(request.params.orderId);

      if (!orderIdParam) {
        throw new HttpError({ message: 'Missing order ID', statusCode: 400 });
      }

      const orderId = Number.parseInt(orderIdParam, 10);

      if (Number.isNaN(orderId)) {
        throw new HttpError({ message: 'Invalid order ID', statusCode: 400 });
      }

      const result = await repository.getOrderById(orderId);

      if (!result) {
        throw new HttpError({ message: 'Order not found', statusCode: 404 });
      }

      response.json(result);
    },
  }),
  getPaginated: createRequestHandler({
    handler: async ({ request, response }) => {
      if (enterpriseOrdersDelayMs > 0) {
        await delay({ milliseconds: enterpriseOrdersDelayMs });
      }

      const skip = readQueryInteger({
        fallback: 0,
        value: request.query.skip,
      });
      const limit = readQueryInteger({
        fallback: DEFAULT_PAGE_LIMIT,
        min: 1,
        value: request.query.limit,
      });
      const sorting = parseEnterpriseOrdersSorting({
        allowedColumns: ENTERPRISE_ORDER_ALLOWED_COLUMNS,
        value: request.query.sort,
      });
      const filters = parseEnterpriseOrdersFilters({
        allowedColumns: ENTERPRISE_ORDER_ALLOWED_COLUMNS,
        value: request.query.filter,
      });

      const result = await repository.getPaginated({
        filters,
        limit,
        skip,
        sorting,
      });

      response.json(result);
    },
  }),
});
