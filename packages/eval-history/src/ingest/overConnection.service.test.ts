import { describe, expect, it, vi } from 'vite-plus/test';

import type { IngestReport } from './ingest.types.ts';

import { overConnection } from './overConnection.service.ts';

type ReportOfArgs = {
  readonly file: string;
  readonly problems?: readonly string[];
};

const reportOf = ({ file, problems = [] }: ReportOfArgs) =>
  ({
    durationMs: 0,
    file,
    problems,
    result: problems.length === 0 ? 'inserted' : 'unsent',
    rows: { cases: 1, verdicts: 1 },
  }) satisfies IngestReport;

const client = { query: async () => ({ rows: [] }) };

describe('overConnection', () => {
  it('connects once, steps through every item in order, and closes', async () => {
    const end = vi.fn(async () => {});
    const connect = vi.fn(async () => ({ client, end }));

    expect(
      await overConnection({
        connect,
        items: ['a.json', 'b.json'],
        step: async ({ item }) => reportOf({ file: item }),
        unsent: ({ item, problem }) =>
          reportOf({ file: item, problems: [problem] }),
      }),
    ).toEqual([reportOf({ file: 'a.json' }), reportOf({ file: 'b.json' })]);
    expect(connect).toHaveBeenCalledOnce();
    expect(end).toHaveBeenCalledOnce();
  });

  it('closes the connection when a step throws', async () => {
    const end = vi.fn(async () => {});

    await expect(
      overConnection({
        connect: async () => ({ client, end }),
        items: ['a.json'],
        step: async () => {
          throw new Error('socket hang up');
        },
        unsent: ({ item, problem }) =>
          reportOf({ file: item, problems: [problem] }),
      }),
    ).rejects.toThrow('socket hang up');
    expect(end).toHaveBeenCalledOnce();
  });

  it('reports every item unsent when it cannot connect', async () => {
    expect(
      await overConnection({
        connect: async () => {
          throw new Error('ECONNREFUSED');
        },
        items: ['a.json', 'b.json'],
        step: async ({ item }) => reportOf({ file: item }),
        unsent: ({ item, problem }) =>
          reportOf({ file: item, problems: [problem] }),
      }),
    ).toEqual([
      reportOf({
        file: 'a.json',
        problems: ['could not connect: ECONNREFUSED'],
      }),
      reportOf({
        file: 'b.json',
        problems: ['could not connect: ECONNREFUSED'],
      }),
    ]);
  });

  it('does not connect for no items', async () => {
    const connect = vi.fn();

    expect(
      await overConnection({
        connect,
        items: [],
        step: async ({ item }: { readonly item: string }) =>
          reportOf({ file: item }),
        unsent: ({ item, problem }) =>
          reportOf({ file: item, problems: [problem] }),
      }),
    ).toEqual([]);
    expect(connect).not.toHaveBeenCalled();
  });
});
