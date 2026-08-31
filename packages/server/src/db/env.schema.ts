import { z } from 'zod';

export const envSchema = z.object({
  DB_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  /**
   * The ceiling a grouped read installs on its own transaction, deliberately far shorter
   * than the pool-wide `DB_STATEMENT_TIMEOUT_MS`: a grouped read sits behind a loader, 30 s
   * outlasts any browser-side patience, and failing at 10 s leaves headroom to render an
   * error rather than having the request itself time out (ADR-066).
   */
  DB_GROUP_STATEMENT_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(10_000),
  DB_HOST: z.string().min(1),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  DB_NAME: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  DB_PORT: z.coerce.number().int().positive(),
  DB_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  DB_USER: z.string().min(1),
});

export type EnvConfig = z.infer<typeof envSchema>;

type ReadEnvConfigArgs = {
  readonly env: NodeJS.ProcessEnv;
};

export const readEnvConfig = ({ env }: ReadEnvConfigArgs): EnvConfig =>
  envSchema.parse(env);

export const readGroupStatementTimeoutMs = ({ env }: ReadEnvConfigArgs) =>
  envSchema.pick({ DB_GROUP_STATEMENT_TIMEOUT_MS: true }).parse(env)
    .DB_GROUP_STATEMENT_TIMEOUT_MS;
