import { Router } from 'express';

import { createDbSanityController } from './dbSanity.controller';
import { createDbSanityRepository } from './dbSanity.repository';

/**
 * Build the DB sanity router.
 */
export const createDbSanityRoute = (): Router => {
  const router = Router();
  const repository = createDbSanityRepository();
  const controller = createDbSanityController({ repository });

  router.get('/', controller.getDbSanity);

  return router;
};
