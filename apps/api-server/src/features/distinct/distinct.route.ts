import type { Pool } from 'pg';

import { Router } from 'express';

import type { EnvConfig } from '../../config/env.schema';

import { createDistinctController } from './distinct.controller';
import { createDistinctRepository } from './distinct.repository';

type CreateDistinctRouteArgs = {
  readonly envConfig: EnvConfig;
  readonly pool: Pool;
};

/**
 * Build the generic distinct-values router.
 */
export const createDistinctRoute = ({
  envConfig,
  pool,
}: CreateDistinctRouteArgs): Router => {
  const router = Router();
  const repository = createDistinctRepository({ pool });
  const controller = createDistinctController({
    distinctValuesDelayMs: envConfig.DISTINCT_VALUES_DELAY_MS,
    repository,
  });

  router.get('/', controller.getDistinctValues);

  return router;
};
