import { resolveFetchSignal } from './resolve-fetch-signal.util.ts';

type FetchAndValidateArgs<T> = {
  readonly isValid: (value: unknown) => value is T;
  readonly shapeErrorMessage: string;
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  readonly url: string;
};

/**
 * There is deliberately no default timeout: one ceiling cannot suit both an SSR loader and
 * a browser call, and imposing one would change behaviour for every existing caller at
 * once.
 * @throws When the response is not OK or fails the shape guard.
 * @throws `TimeoutError` when `timeoutMs` elapses before the response.
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
