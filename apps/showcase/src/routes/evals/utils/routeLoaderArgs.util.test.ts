import { describe, expect, it } from 'vite-plus/test';

import { routeLoaderArgs } from './routeLoaderArgs.util';

describe('routeLoaderArgs', () => {
  it('fills the path parameters into the request URL', () => {
    const { params, request } = routeLoaderArgs({
      params: { runId: 'abc' },
      path: 'evals/runs/:runId/trials',
      search: '?trial=4',
    });

    expect(request.url).toBe('http://localhost/evals/runs/abc/trials?trial=4');
    expect(params).toEqual({ runId: 'abc' });
  });

  it('refuses a path parameter it has no value for', () => {
    expect(() =>
      routeLoaderArgs({ params: {}, path: 'evals/runs/:runId' }),
    ).toThrow('no value for :runId in evals/runs/:runId');
  });

  it('keeps the literal suffix of a partial path parameter', () => {
    const { params, request } = routeLoaderArgs({
      params: { runId: 'abc' },
      path: 'evals/runs/:runId.json',
    });

    expect(request.url).toBe('http://localhost/evals/runs/abc.json');
    expect(params).toEqual({ runId: 'abc' });
  });

  it('names a partial path parameter it has no value for', () => {
    expect(() =>
      routeLoaderArgs({ params: {}, path: 'evals/runs/:runId.json' }),
    ).toThrow('no value for :runId in evals/runs/:runId.json');
  });
});
