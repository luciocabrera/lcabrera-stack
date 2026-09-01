import { describe, expect, it } from 'vite-plus/test';

import { fetchPackument, registryUrl } from './registry-packument.mjs';

const respondWith = (init) => {
  const calls = [];
  const fetchImpl = (url, options) => {
    calls.push({ options, url });

    return Promise.resolve({
      json: () => Promise.resolve({ name: '@lcabrera/utils' }),
      ok: init.status < 400,
      status: init.status,
      statusText: init.statusText ?? '',
    });
  };

  return { calls, fetchImpl };
};

describe('registryUrl', () => {
  it('encodes the whole scoped name as one path segment', () => {
    expect(registryUrl('@lcabrera/utils')).toMatch(/%40lcabrera%2Futils$/);
  });
});

describe('fetchPackument', () => {
  it('asks for the abbreviated document by default', async () => {
    const { calls, fetchImpl } = respondWith({ status: 200 });

    await fetchPackument('@lcabrera/utils', { fetchImpl });

    expect(calls[0].options.headers.accept).toBe(
      'application/vnd.npm.install-v1+json',
    );
  });

  it('asks for the full document when a caller needs exports', async () => {
    const { calls, fetchImpl } = respondWith({ status: 200 });

    await fetchPackument('@lcabrera/utils', { fetchImpl, full: true });

    expect(calls[0].options.headers.accept).toBe('application/json');
  });

  it('reads a 404 as "never published" rather than an error', async () => {
    const { fetchImpl } = respondWith({ status: 404 });

    await expect(
      fetchPackument('@lcabrera/nope', { fetchImpl }),
    ).resolves.toBeUndefined();
  });

  it('throws on a server error rather than reporting nothing found', async () => {
    const { fetchImpl } = respondWith({ status: 503, statusText: 'x' });

    await expect(
      fetchPackument('@lcabrera/utils', { fetchImpl }),
    ).rejects.toThrow('503');
  });

  it('propagates a transport failure', async () => {
    const fetchImpl = () => Promise.reject(new Error('fetch failed'));

    await expect(
      fetchPackument('@lcabrera/utils', { fetchImpl }),
    ).rejects.toThrow('fetch failed');
  });
});
