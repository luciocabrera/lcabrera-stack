import type { Pool } from 'pg';

import cors from '@fastify/cors';
import { HttpError } from 'api-shared';
import Fastify, {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from 'fastify';

import type { EnvConfig } from '../config/env.schema';

import { createCarSalesPlugin } from '../features/carSales/carSales.plugin';
import { createDbSanityPlugin } from '../features/dbSanity/dbSanity.plugin';
import { createDistinctPlugin } from '../features/distinct/distinct.plugin';
import { createEnterpriseOrdersPlugin } from '../features/enterpriseOrders/enterpriseOrders.plugin';
import { createWideAlltypes150Plugin } from '../features/wideAlltypes150/wideAlltypes150.plugin';

type CreateAppArgs = {
  readonly envConfig: EnvConfig;
  readonly pool: Pool;
};

type RequestWithStartNs = FastifyRequest & {
  requestStartNs?: bigint;
};

const formatHumanTimestamp = () => {
  const now = new Date();
  const date = now.toLocaleDateString('sv-SE');
  const time = now.toLocaleTimeString('sv-SE', { hour12: false });
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

  return `${date} ${time}.${milliseconds}`;
};

const getDurationMs = ({
  request,
}: {
  readonly request: RequestWithStartNs;
}) => {
  if (request.requestStartNs === undefined) {
    return 0;
  }

  const elapsedNs = process.hrtime.bigint() - request.requestStartNs;
  return Number(elapsedNs) / 1_000_000;
};

const logApiRequest = ({
  reply,
  request,
}: {
  readonly reply: FastifyReply;
  readonly request: RequestWithStartNs;
}) => {
  const timestamp = formatHumanTimestamp();
  const durationMs = getDurationMs({ request }).toFixed(1);
  const endpoint = request.url.split('?', 1)[0] ?? request.url;

  console.info(
    `[API][${timestamp}] ${request.method} ${endpoint} -> ${reply.statusCode} (${durationMs}ms)`,
  );
};

/**
 * Create the Fastify application with all API routes.
 */
export const createApp = ({
  envConfig,
  pool,
}: CreateAppArgs): FastifyInstance => {
  const app = Fastify({ logger: false });

  app.addHook('onRequest', (request, _reply, done) => {
    const requestWithStartNs = request as RequestWithStartNs;
    requestWithStartNs.requestStartNs = process.hrtime.bigint();
    done();
  });

  app.addHook('onResponse', (request, reply, done) => {
    logApiRequest({
      reply,
      request: request as RequestWithStartNs,
    });
    done();
  });

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
  app.register(createDistinctPlugin({ envConfig, pool }), {
    prefix: '/api/distinct',
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
