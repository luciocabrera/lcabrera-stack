import type { Pool } from 'pg';

import { HttpError } from 'api-shared';
import cors from 'cors';
import express, { type Express, Router } from 'express';

import type { EnvConfig } from '../config/env.schema';

import { createCarSalesRoute } from '../features/carSales/carSales.route';
import { createDbSanityRoute } from '../features/dbSanity/dbSanity.route';
import { createDistinctRoute } from '../features/distinct/distinct.route';
import { createEnterpriseOrdersRoute } from '../features/enterpriseOrders/enterpriseOrders.route';
import { createWideAlltypes150Route } from '../features/wideAlltypes150/wideAlltypes150.route';
import { errorMiddleware } from '../middleware/error.middleware';

type CreateAppArgs = {
  readonly envConfig: EnvConfig;
  readonly pool: Pool;
};

/**
 * Create the Express application with all API routes.
 */
export const createApp = ({ envConfig, pool }: CreateAppArgs): Express => {
  const app = express();
  const apiRouter = Router();
  const allowedCorsOrigins = new Set(
    envConfig.CORS_ALLOWED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, !origin || allowedCorsOrigins.has(origin));
      },
    }),
  );
  app.use(express.json());

  apiRouter.use('/car-sales', createCarSalesRoute({ pool }));
  apiRouter.use('/distinct', createDistinctRoute({ envConfig, pool }));
  apiRouter.use(
    '/enterprise-orders',
    createEnterpriseOrdersRoute({ envConfig, pool }),
  );
  apiRouter.use('/wide-alltypes-150', createWideAlltypes150Route({ pool }));
  apiRouter.use('/db-sanity', createDbSanityRoute({ pool }));

  app.use('/api', apiRouter);
  // eslint-disable-next-line local-rules/destructuring-for-functions
  app.use((_request, _response, next) => {
    next(new HttpError({ message: 'Route not found', statusCode: 404 }));
  });
  app.use(errorMiddleware);

  return app;
};
