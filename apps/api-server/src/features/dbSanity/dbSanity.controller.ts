import type { RequestHandler } from 'express';

import { createRequestHandler } from '../../utils/createRequestHandler.util';

import type { DbSanityRepository } from './dbSanity.repository';

export type DbSanityController = {
  readonly getDbSanity: RequestHandler;
};

type CreateDbSanityControllerArgs = {
  readonly repository: DbSanityRepository;
};

/**
 * HTTP handlers for DB sanity endpoints.
 */
export const createDbSanityController = ({
  repository,
}: CreateDbSanityControllerArgs): DbSanityController => ({
  getDbSanity: createRequestHandler({
    handler: async ({ response }) => {
      const sanity = await repository.getDbSanity();
      response.status(sanity.isHealthy ? 200 : 503).json(sanity);
    },
  }),
});
