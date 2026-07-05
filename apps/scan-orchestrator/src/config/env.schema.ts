import { z } from 'zod';

// DB_* vars are validated separately by @repo/data-access's own env.schema
// (getPool() reads them independently) — this schema only covers what's
// genuinely local to this process: the WS port and the Agent SDK
// credential, per TECH_SPEC §2.6's "apps/scan-orchestrator needs its own
// Zod-validated ANTHROPIC_API_KEY" requirement.
export const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1),
  SCAN_ORCHESTRATOR_PORT: z.coerce.number().int().positive().default(4100),
});

export type EnvConfig = z.infer<typeof envSchema>;

type ReadEnvConfigArgs = {
  readonly env: NodeJS.ProcessEnv;
};

export const readEnvConfig = ({ env }: ReadEnvConfigArgs): EnvConfig =>
  envSchema.parse(env);
