import { z } from 'zod';

/**
 * CQMS_WS_TICKET_SECRET is the HMAC key this app signs `/ws/runs`
 * subscription tickets with (ADR-041); apps/scan-orchestrator verifies them
 * with the same value, so the two must match or every subscription is
 * rejected.
 *
 * Unlike SESSION_SECRET in `./env.schema.ts`, this one has **no dev
 * default**. A shared fallback would let both processes agree on a secret
 * that is published in this repository, which authenticates nothing while
 * looking like it does — precisely the gap this control was added to close
 * (STATUS.md §3.3). A missing value fails loudly at the first mint instead.
 */
const wsTicketEnvSchema = z.object({
  CQMS_WS_TICKET_SECRET: z.string().min(1),
});

type ReadWsTicketEnvConfigArgs = {
  readonly env: NodeJS.ProcessEnv;
};

export const readWsTicketEnvConfig = ({ env }: ReadWsTicketEnvConfigArgs) =>
  wsTicketEnvSchema.parse(env);
