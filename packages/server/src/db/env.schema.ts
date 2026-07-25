import { z } from 'zod';

/**
 * The five credential keys are required; the four tuning keys are optional and
 * defaulted, so an environment that predates them still boots unchanged.
 *
 * The defaults are not pg's. pg waits **forever** to acquire a connection and
 * puts no ceiling on a statement, so a single slow query holds its connection
 * indefinitely and the process stalls rather than degrading — the failure this
 * schema exists to bound. `DB_POOL_MAX` and `DB_IDLE_TIMEOUT_MS` keep pg's own
 * values on purpose: those two were never the problem, and changing them here
 * would silently re-tune every consumer.
 */
export const envSchema = z.object({
  DB_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
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
