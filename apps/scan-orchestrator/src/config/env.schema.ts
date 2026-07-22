import { z } from 'zod';

// DB_* vars are validated separately by @lcabrera/server's own env.schema
// (getPool() reads them independently) — this schema only covers what's
// genuinely local to this process: the WS port, the Agent SDK credential
// (per TECH_SPEC §2.6's "apps/scan-orchestrator needs its own Zod-validated
// ANTHROPIC_API_KEY" requirement), the org-wide rolling-24h LLM cost cap (the
// Claude API cost-incident remediation) — set this to your actual budget
// tolerance; 50 is a placeholder, not a recommendation — and the global
// concurrency cap.
//
// MAX_CONCURRENT_SCANS is the host-protection cap of PRD_V2 §9 / ADR-033:
// how many scans this orchestrator executes on the host simultaneously. §8's
// per-project lock (migration 0021) still caps each project at one run, but
// with N projects each running their one allowed run, N host executions would
// start at once with nothing bounding them. Scans beyond the cap wait for a
// slot rather than being rejected. Default 3 is a conservative starting point;
// raise it as host capacity (and, in Phase 2, the run container) allows.
// Not exported: `readEnvConfig` below is the only way this schema is meant to
// be applied, so exporting the raw schema would invite a second parse path that
// could drift from it.
//
// CQMS_WS_TICKET_SECRET is the HMAC key that /ws/runs subscriptions are
// signed with (ADR-041). It is deliberately **required with no default**:
// a dev-only fallback would let the orchestrator start with a secret the
// whole world knows, which authenticates nothing while looking like it
// does — the exact failure this control exists to close. The same value
// must be set for apps/admin_system, which mints the tickets this process
// verifies; a mismatch rejects every subscription rather than failing open.
const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1),
  CQMS_WS_TICKET_SECRET: z.string().min(1),
  LLM_DAILY_COST_CAP_USD: z.coerce.number().positive().default(50),
  MAX_CONCURRENT_SCANS: z.coerce.number().int().positive().default(3),
  SCAN_ORCHESTRATOR_PORT: z.coerce.number().int().positive().default(4100),
});

export type EnvConfig = z.infer<typeof envSchema>;

type ReadEnvConfigArgs = {
  readonly env: NodeJS.ProcessEnv;
};

export const readEnvConfig = ({ env }: ReadEnvConfigArgs): EnvConfig =>
  envSchema.parse(env);
