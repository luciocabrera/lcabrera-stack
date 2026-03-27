import { Router } from "express";
import type { Pool } from "pg";

import { createWideAlltypes150Controller } from "./wideAlltypes150.controller";
import { createWideAlltypes150Repository } from "./wideAlltypes150.repository";

type CreateWideAlltypes150RouteArgs = {
  readonly pool: Pool;
};

/**
 * Build the wide-alltypes router.
 */
export const createWideAlltypes150Route = ({ pool }: CreateWideAlltypes150RouteArgs): Router => {
  const router = Router();
  const repository = createWideAlltypes150Repository({ pool });
  const controller = createWideAlltypes150Controller({ repository });

  router.get("/paginated", controller.getPaginated);

  return router;
};
