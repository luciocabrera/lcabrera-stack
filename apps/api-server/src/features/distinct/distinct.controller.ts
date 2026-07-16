import type { RequestHandler } from 'express';

import { DISTINCT_DEFAULT_LIMIT, HttpError } from 'api-shared';

import type { DistinctRepository } from './distinct.repository';

import { createRequestHandler } from '../../utils/createRequestHandler.util';
import { delay } from '../../utils/delay.util';
import { readQueryInteger } from '../../utils/readQueryInteger.util';
import { readQueryValue } from '../../utils/readQueryValue.util';

export type DistinctController = {
  readonly getDistinctValues: RequestHandler;
};

type CreateDistinctControllerArgs = {
  readonly distinctValuesDelayMs: number;
  readonly repository: DistinctRepository;
};

/**
 * HTTP handler for the generic distinct-values endpoint
 * (`GET /api/distinct?schemaName&tableName&columnName&limit&offset`).
 * Source authorization happens in the repository via parseDistinctSource
 * (allow-list, 400 on unknown source/column).
 */
export const createDistinctController = ({
  distinctValuesDelayMs,
  repository,
}: CreateDistinctControllerArgs): DistinctController => ({
  getDistinctValues: createRequestHandler({
    handler: async ({ request, response }) => {
      if (distinctValuesDelayMs > 0) {
        await delay({ milliseconds: distinctValuesDelayMs });
      }

      const schemaName = readQueryValue(request.query.schemaName);
      const tableName = readQueryValue(request.query.tableName);
      const columnName = readQueryValue(request.query.columnName);

      if (!schemaName || !tableName || !columnName) {
        throw new HttpError({
          message: 'Missing schemaName, tableName, or columnName',
          statusCode: 400,
        });
      }

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
        schemaName,
        tableName,
      });

      response.json(result);
    },
  }),
});
