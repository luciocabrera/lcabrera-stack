import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Pool } from 'pg';

import type { EnvConfig } from '../config/env.schema';
import { HttpError } from 'api-shared';
import { createCarSalesPlugin } from '../features/carSales/carSales.plugin';
import { createDbSanityPlugin } from '../features/dbSanity/dbSanity.plugin';
import { createEnterpriseOrdersPlugin } from '../features/enterpriseOrders/enterpriseOrders.plugin';
import { createWideAlltypes150Plugin } from '../features/wideAlltypes150/wideAlltypes150.plugin';

type CreateAppArgs = {
  readonly envConfig: EnvConfig;
  readonly pool: Pool;
};

/**
 * Create the Fastify application with all API routes.
 */
export const createApp = ({
  envConfig,
  pool,
}: CreateAppArgs): FastifyInstance => {
  const app = Fastify({ logger: false });

  app.register(cors);

  // --- Error handling ---------------------------------------------------

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof HttpError) {
      reply.status(error.statusCode).send({ error: error.message });
      return;
    }

    // Fastify validation errors (schema failures) carry a statusCode
    const statusCode =
      'statusCode' in (error as object) &&
      typeof (error as { statusCode?: unknown }).statusCode === 'number'
        ? (error as { statusCode: number }).statusCode
        : 500;

    if (statusCode < 500) {
      const message = error instanceof Error ? error.message : 'Bad request';
      reply.status(statusCode).send({ error: message });
      return;
    }

    console.error('❌ Unhandled API error:', error);
    reply.status(500).send({ error: 'Internal server error' });
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({ error: 'Route not found' });
  });

  // --- Route plugins ----------------------------------------------------

  app.register(createCarSalesPlugin({ pool }), {
    prefix: '/api/car-sales',
  });
  app.register(createEnterpriseOrdersPlugin({ envConfig, pool }), {
    prefix: '/api/enterprise-orders',
  });
  app.register(createWideAlltypes150Plugin({ pool }), {
    prefix: '/api/wide-alltypes-150',
  });
  app.register(createDbSanityPlugin({ pool }), {
    prefix: '/api/db-sanity',
  });

  return app;
};
