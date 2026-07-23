import { Router } from 'express';

import type { EnvConfig } from '../../config/env.schema';

import { createDistinctController } from './distinct.controller';
import { createDistinctRepository } from './distinct.repository';

type CreateDistinctRouteArgs = {
  readonly envConfig: EnvConfig;
};

/**
 * Build the generic distinct-values router.
 */
export const createDistinctRoute = ({
  envConfig,
}: CreateDistinctRouteArgs): Router => {
  const router = Router();
  const repository = createDistinctRepository();
  const controller = createDistinctController({
    distinctValuesDelayMs: envConfig.DISTINCT_VALUES_DELAY_MS,
    repository,
  });

  router.get('/', controller.getDistinctValues);

  return router;
};
