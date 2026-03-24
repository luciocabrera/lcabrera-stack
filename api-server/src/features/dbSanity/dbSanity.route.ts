import { Router } from 'express';
import type { Pool } from 'pg';

import { createDbSanityController } from './dbSanity.controller';
import { createDbSanityRepository } from './dbSanity.repository';

type CreateDbSanityRouteArgs = {
  readonly pool: Pool;
};

/**
 * Build the DB sanity router.
 */
export const createDbSanityRoute = ({
  pool,
}: CreateDbSanityRouteArgs): Router => {
  const router = Router();
  const repository = createDbSanityRepository({ pool });
  const controller = createDbSanityController({ repository });

  router.get('/', controller.getDbSanity);

  return router;
};
