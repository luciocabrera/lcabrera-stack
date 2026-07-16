import type { Pool } from 'pg';

import { Router } from 'express';

import { createCarSalesController } from './carSales.controller';
import { createCarSalesRepository } from './carSales.repository';

type CreateCarSalesRouteArgs = {
  readonly pool: Pool;
};

/**
 * Build the car sales router.
 */
export const createCarSalesRoute = ({
  pool,
}: CreateCarSalesRouteArgs): Router => {
  const router = Router();
  const repository = createCarSalesRepository({ pool });
  const controller = createCarSalesController({ repository });

  router.get('/', controller.getAll);
  router.get('/paginated', controller.getPaginated);

  return router;
};
