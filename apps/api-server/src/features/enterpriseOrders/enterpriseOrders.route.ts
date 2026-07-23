import { Router } from 'express';

import type { EnvConfig } from '../../config/env.schema';

import { createEnterpriseOrdersController } from './enterpriseOrders.controller';
import { createEnterpriseOrdersRepository } from './enterpriseOrders.repository';

type CreateEnterpriseOrdersRouteArgs = {
  readonly envConfig: EnvConfig;
};

/**
 * Build the enterprise-orders router.
 */
export const createEnterpriseOrdersRoute = ({
  envConfig,
}: CreateEnterpriseOrdersRouteArgs): Router => {
  const router = Router();
  const repository = createEnterpriseOrdersRepository();
  const controller = createEnterpriseOrdersController({
    enterpriseOrdersDelayMs: envConfig.ENTERPRISE_ORDERS_DELAY_MS,
    repository,
  });

  router.get('/paginated', controller.getPaginated);
  router.get('/:orderId', controller.getOrderById);

  return router;
};
