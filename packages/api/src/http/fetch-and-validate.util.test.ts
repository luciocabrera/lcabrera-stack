import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { fetchAndValidate } from './fetch-and-validate.util.ts';

type Body = { readonly value: string };

const isBody = (value: unknown): value is Body =>
  typeof value === 'object' && value !== null && 'value' in value;

const args = {
  isValid: isBody,
  shapeErrorMessage: 'Invalid body shape',
  url: 'https://example.test/thing',
};

/** A fetch that resolves immediately with the given JSON body. */
const stubOkFetch = (body: unknown) => {
  const okFetch: typeof fetch = async () =>
    ({
      json: async () => body,
      ok: true,
      status: 200,
      statusText: 'OK',
    }) as Response;

  const fetchMock = vi.fn(okFetch);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

/**
 * A fetch that never settles on its own and rejects with the signal's reason
 * when aborted — what a hung endpoint looks like to the caller. Typed as
 * `typeof fetch` so the stub is provably the real signature; a mock that
 * ignored the signal would make every abort test below pass vacuously.
 */
const hangingFetch: typeof fetch = async (_input, init) =>
  new Promise<Response>((_resolve, reject) => {
    const { signal } = init ?? {};

    if (signal?.aborted === true) {
      reject(signal.reason as Error);
      return;
    }

    signal?.addEventListener('abort', () => reject(signal.reason as Error), {
      once: true,
    });
  });

const failingFetch: typeof fetch = async () =>
  ({
    ok: false,
    status: 503,
    statusText: 'Service Unavailable',
  }) as Response;

const stubHangingFetch = () => {
  const fetchMock = vi.fn(hangingFetch);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('fetchAndValidate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the validated body', async () => {
    stubOkFetch({ value: 'ok' });

    await expect(fetchAndValidate<Body>(args)).resolves.toStrictEqual({
      value: 'ok',
    });
  });

  it('throws when the response is not OK', async () => {
    vi.stubGlobal('fetch', vi.fn(failingFetch));

    await expect(fetchAndValidate<Body>(args)).rejects.toThrow(
      'API request failed: 503 Service Unavailable',
    );
  });

  it('throws the shape message when the body fails the guard', async () => {
    stubOkFetch({ unexpected: true });

    await expect(fetchAndValidate<Body>(args)).rejects.toThrow(
      'Invalid body shape',
    );
  });

  it('passes no signal when neither option is given, leaving old callers unchanged', async () => {
    const fetchMock = stubOkFetch({ value: 'ok' });

    await fetchAndValidate<Body>(args);

    expect(fetchMock).toHaveBeenCalledWith(args.url, { signal: undefined });
  });

  it('rejects with a TimeoutError once timeoutMs elapses', async () => {
    stubHangingFetch();

    await expect(
      fetchAndValidate<Body>({ ...args, timeoutMs: 1 }),
    ).rejects.toMatchObject({ name: 'TimeoutError' });
  });

  it('rejects with the caller reason when the caller aborts', async () => {
    stubHangingFetch();
    const controller = new AbortController();
    const pending = fetchAndValidate<Body>({
      ...args,
      signal: controller.signal,
    });

    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('lets a caller abort win over a long timeout rather than being discarded', async () => {
    stubHangingFetch();
    const controller = new AbortController();
    const pending = fetchAndValidate<Body>({
      ...args,
      signal: controller.signal,
      timeoutMs: 60_000,
    });

    controller.abort(new Error('superseded'));

    await expect(pending).rejects.toThrow('superseded');
  });
});
