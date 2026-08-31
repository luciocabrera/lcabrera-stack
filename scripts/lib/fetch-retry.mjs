/**
 * Transport-level retry for the scripts that call an HTTP API directly.
 *
 * Undici surfaces a DNS failure, a reset connection or a TLS handshake error as
 * a thrown `fetch failed` with no status and no detail, so a single blip fails
 * the whole job — which is how the label sync went red twice on unrelated PRs.
 * Retrying is the fix; the alternative on offer is a human re-running the job,
 * which is a workaround that reports the same green.
 *
 * Retries a **transport throw** and the statuses that are transient by
 * definition. A 4xx is never retried: it is the server saying the request is
 * wrong, and repeating it wastes the budget and hides the message.
 *
 * The delay schedule and the retryable-status set are pure and exported so the
 * policy is unit-tested rather than inferred from timing.
 */
import { setTimeout as pause } from 'node:timers/promises';

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

const DEFAULT_ATTEMPTS = 4;
const BASE_DELAY_MS = 250;
const MAX_DELAY_MS = 4000;

export const isRetryableStatus = (status) => RETRYABLE_STATUS.has(status);

export const retryDelayMs = (attemptIndex) =>
  Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attemptIndex);

export const fetchWithRetry = async (attempt, options = {}) => {
  const { attempts = DEFAULT_ATTEMPTS, onRetry, sleep = pause } = options;

  for (let index = 0; index < attempts - 1; index += 1) {
    const outcome = await attempt().then(
      (response) => ({ response }),
      (error) => ({ error }),
    );

    if (
      outcome.error === undefined &&
      !isRetryableStatus(outcome.response.status)
    ) {
      return outcome.response;
    }

    onRetry?.({
      attempt: index + 1,
      reason: outcome.error?.message ?? `HTTP ${outcome.response.status}`,
    });
    await sleep(retryDelayMs(index));
  }

  return attempt();
};
