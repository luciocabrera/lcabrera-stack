import type { RequestHandler } from 'express';

import {
  DEFAULT_PAGE_LIMIT,
  DISTINCT_DEFAULT_LIMIT,
  ENTERPRISE_ORDER_ALLOWED_COLUMNS,
  ENTERPRISE_ORDER_DISTINCT_COLUMNS,
  HttpError,
} from 'api-shared';

import { createRequestHandler } from '../../utils/createRequestHandler.util';
import { delay } from '../../utils/delay.util';
import { readQueryInteger } from '../../utils/readQueryInteger.util';
import { readQueryValue } from '../../utils/readQueryValue.util';

import type { EnterpriseOrdersRepository } from './enterpriseOrders.repository';
import {
  parseDistinctColumnName,
  parseEnterpriseOrdersFilters,
  parseEnterpriseOrdersSorting,
} from './enterpriseOrders.schema';

export type EnterpriseOrdersController = {
  readonly getDistinctValues: RequestHandler;
  readonly getOrderById: RequestHandler;
  readonly getPaginated: RequestHandler;
};

type CreateEnterpriseOrdersControllerArgs = {
  readonly distinctValuesDelayMs: number;
  readonly enterpriseOrdersDelayMs: number;
  readonly repository: EnterpriseOrdersRepository;
};

/**
 * HTTP handlers for enterprise-order endpoints.
 */
export const createEnterpriseOrdersController = ({
  distinctValuesDelayMs,
  enterpriseOrdersDelayMs,
  repository,
}: CreateEnterpriseOrdersControllerArgs): EnterpriseOrdersController => ({
  getDistinctValues: createRequestHandler({
    handler: async ({ request, response }) => {
      if (distinctValuesDelayMs > 0) {
        await delay({ milliseconds: distinctValuesDelayMs });
      }

      const columnNameParam = readQueryValue(request.params.columnName);

      if (!columnNameParam) {
        throw new HttpError({
          message: 'Missing distinct column name',
          statusCode: 400,
        });
      }

      const columnName = parseDistinctColumnName({
        allowedColumns: ENTERPRISE_ORDER_DISTINCT_COLUMNS,
        value: columnNameParam,
      });
      const limit = readQueryInteger({
        fallback: DISTINCT_DEFAULT_LIMIT,
        min: 1,
        value: request.query.limit,
      });
      const offset = readQueryInteger({
        fallback: 0,
        value: request.query.offset,
      });

      const result = await repository.getDistinctValues({
        columnName,
        limit,
        offset,
      });

      response.json(result);
    },
  }),
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
