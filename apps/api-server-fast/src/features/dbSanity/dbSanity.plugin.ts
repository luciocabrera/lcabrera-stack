import type { FastifyPluginAsync } from "fastify";
import type { Pool } from "pg";

import { createDbSanityRepository } from "./dbSanity.repository";

type CreateDbSanityPluginArgs = {
  readonly pool: Pool;
};

/**
 * Fastify plugin for DB sanity endpoints.
 */
export const createDbSanityPlugin =
  ({ pool }: CreateDbSanityPluginArgs): FastifyPluginAsync =>
  async (fastify) => {
    const repository = createDbSanityRepository({ pool });

    fastify.get("/", async (_request, reply) => {
      const sanity = await repository.getDbSanity();
      reply.status(sanity.isHealthy ? 200 : 503);
      return sanity;
    });
  };
