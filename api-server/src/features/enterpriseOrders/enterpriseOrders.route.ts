import { Router } from 'express';
import type { Pool } from 'pg';

import type { EnvConfig } from '../../config/env.schema';

import { createEnterpriseOrdersController } from './enterpriseOrders.controller';
import { createEnterpriseOrdersRepository } from './enterpriseOrders.repository';

type CreateEnterpriseOrdersRouteArgs = {
  readonly envConfig: EnvConfig;
  readonly pool: Pool;
};

/**
 * Build the enterprise-orders router.
 */
export const createEnterpriseOrdersRoute = ({
  envConfig,
  pool,
}: CreateEnterpriseOrdersRouteArgs): Router => {
  const router = Router();
  const repository = createEnterpriseOrdersRepository({ pool });
  const controller = createEnterpriseOrdersController({
    distinctValuesDelayMs: envConfig.DISTINCT_VALUES_DELAY_MS,
    enterpriseOrdersDelayMs: envConfig.ENTERPRISE_ORDERS_DELAY_MS,
    repository,
  });

  router.get('/paginated', controller.getPaginated);
  router.get('/distinct/:columnName', controller.getDistinctValues);
  router.get('/:orderId', controller.getOrderById);

  return router;
};
