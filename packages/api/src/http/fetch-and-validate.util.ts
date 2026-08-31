import { resolveFetchSignal } from './resolve-fetch-signal.util.ts';

type FetchAndValidateArgs<T> = {
  readonly isValid: (value: unknown) => value is T;
  readonly shapeErrorMessage: string;
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  readonly url: string;
};

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
