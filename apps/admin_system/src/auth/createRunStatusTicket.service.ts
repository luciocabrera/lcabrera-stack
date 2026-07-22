import { signAccessTicket } from '@lcabrera/server/tickets/sign-access-ticket.util';

import { readWsTicketEnvConfig } from './wsTicketEnv.schema';

/**
 * How long a `/ws/runs` subscription ticket stays usable. Long enough that a
 * dropped socket reconnects without a page reload, short enough that a
 * leaked one is not a standing grant. It does not need to outlive a long
 * run: every status message triggers a revalidation, which re-runs the
 * loader and hands the client a fresh ticket, so an actively-updating run
 * keeps renewing itself.
 */
const TICKET_TTL_MS = 60 * 60 * 1000;

type CreateRunStatusTicketArgs = {
  readonly runId: string;
};

/**
 * Mints the capability a client presents to apps/scan-orchestrator to
 * subscribe to one run's live status (ADR-041).
 *
 * This is a service, not a util, because it reads both the environment and
 * the clock. Call it only from a loader that has already established the
 * caller may read this run — issuing the ticket *is* the authorization
 * decision, and the orchestrator does no further checking beyond verifying
 * the signature.
 */
export const createRunStatusTicket = ({ runId }: CreateRunStatusTicketArgs) =>
  signAccessTicket({
    expiresAt: Date.now() + TICKET_TTL_MS,
    secret: readWsTicketEnvConfig({ env: process.env }).CQMS_WS_TICKET_SECRET,
    subject: runId,
  });
