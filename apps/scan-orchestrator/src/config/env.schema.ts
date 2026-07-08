import { z } from 'zod';

// DB_* vars are validated separately by @repo/data-access's own env.schema
// (getPool() reads them independently) — this schema only covers what's
// genuinely local to this process: the WS port, the Agent SDK credential
// (per TECH_SPEC §2.6's "apps/scan-orchestrator needs its own Zod-validated
// ANTHROPIC_API_KEY" requirement), and the org-wide rolling-24h LLM cost
// cap (the Claude API cost-incident remediation) — set this to your actual
// budget tolerance; 50 is a placeholder, not a recommendation.
export const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1),
  LLM_DAILY_COST_CAP_USD: z.coerce.number().positive().default(50),
  SCAN_ORCHESTRATOR_PORT: z.coerce.number().int().positive().default(4100),
});

export type EnvConfig = z.infer<typeof envSchema>;

type ReadEnvConfigArgs = {
  readonly env: NodeJS.ProcessEnv;
};

export const readEnvConfig = ({ env }: ReadEnvConfigArgs): EnvConfig =>
  envSchema.parse(env);
