import { Router } from 'express';

import { createWideAlltypes150Controller } from './wideAlltypes150.controller';
import { createWideAlltypes150Repository } from './wideAlltypes150.repository';

/**
 * Build the wide-alltypes router.
 */
export const createWideAlltypes150Route = (): Router => {
  const router = Router();
  const repository = createWideAlltypes150Repository();
  const controller = createWideAlltypes150Controller({ repository });

  router.get('/paginated', controller.getPaginated);

  return router;
};
