import { Router } from 'express';

import { createCarSalesController } from './carSales.controller';
import { createCarSalesRepository } from './carSales.repository';

/**
 * Build the car sales router.
 */
export const createCarSalesRoute = (): Router => {
  const router = Router();
  const repository = createCarSalesRepository();
  const controller = createCarSalesController({ repository });

  router.get('/', controller.getAll);
  router.get('/paginated', controller.getPaginated);

  return router;
};
