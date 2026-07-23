import type { FastifyPluginAsync } from 'fastify';

import { createDbSanityRepository } from './dbSanity.repository';

/**
 * Fastify plugin for DB sanity endpoints.
 */
export const createDbSanityPlugin = (): FastifyPluginAsync => {
  const repository = createDbSanityRepository();

  return async (fastify) => {
    fastify.get('/', async (_request, reply) => {
      const sanity = await repository.getDbSanity();
      reply.status(sanity.isHealthy ? 200 : 503);
      return sanity;
    });
  };
};
