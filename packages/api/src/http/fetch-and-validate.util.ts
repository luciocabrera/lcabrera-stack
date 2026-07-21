import { resolveFetchSignal } from './resolve-fetch-signal.util.ts';

type FetchAndValidateArgs<T> = {
  readonly isValid: (value: unknown) => value is T;
  readonly shapeErrorMessage: string;
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  readonly url: string;
};

/**
 * Fetch a URL, assert an OK response, parse JSON, and validate its shape with a
 * type guard before returning the typed body.
 *
 * Cancellation is **opt-in**. With neither `signal` nor `timeoutMs` the request
 * waits as long as the platform allows, exactly as it did before these options
 * existed. There is deliberately no default timeout: one ceiling cannot suit
 * both an SSR loader and a browser call, and imposing one would change
 * behaviour for every existing caller at once. Pass what the call site needs.
 *
 * The two abort sources stay distinguishable, so a consumer can tell "the
 * server is slow" from "I cancelled this" without this package inventing an
 * error type for it.
 *
 * @param args - Endpoint URL, response type guard, shape-mismatch message, and
 *   optional `signal` / `timeoutMs`.
 * @returns The validated response body.
 * @throws When the response is not OK or fails the shape guard.
 * @throws `TimeoutError` when `timeoutMs` elapses before the response.
 * @throws The caller's abort reason (an `AbortError` unless the caller set one)
 *   when `signal` aborts first.
 */
export const fetchAndValidate = async <T>({
  isValid,
  shapeErrorMessage,
  signal,
  timeoutMs,
  url,
}: FetchAndValidateArgs<T>): Promise<T> => {
  const response = await fetch(url, {
    signal: resolveFetchSignal({ signal, timeoutMs }),
  });

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as unknown;
  if (!isValid(body)) {
    throw new Error(shapeErrorMessage);
  }

  return body;
};
