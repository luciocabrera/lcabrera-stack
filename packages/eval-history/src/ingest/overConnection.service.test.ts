import { describe, expect, it, vi } from 'vite-plus/test';

import type { IngestConnection, IngestReport } from './ingest.types.ts';

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

type OverFilesArgs = {
  readonly connect: () => Promise<IngestConnection>;
  readonly items: readonly string[];
  readonly step?: (args: { readonly item: string }) => Promise<IngestReport>;
};

const overFiles = ({
  connect,
  items,
  step = async ({ item }) => reportOf({ file: item }),
}: OverFilesArgs) =>
  overConnection({
    connect,
    items,
    step,
    unsent: ({ item, problem }) =>
      reportOf({ file: item, problems: [problem] }),
  });

const client = { query: async () => ({ rows: [] }) };

describe('overConnection', () => {
  it('connects once, steps through every item in order, and closes', async () => {
    const end = vi.fn(async () => {});
    const connect = vi.fn(async () => ({ client, end }));

    expect(await overFiles({ connect, items: ['a.json', 'b.json'] })).toEqual([
      reportOf({ file: 'a.json' }),
      reportOf({ file: 'b.json' }),
    ]);
    expect(connect).toHaveBeenCalledOnce();
    expect(end).toHaveBeenCalledOnce();
  });

  it('closes the connection when a step throws', async () => {
    const end = vi.fn(async () => {});

    await expect(
      overFiles({
        connect: async () => ({ client, end }),
        items: ['a.json'],
        step: async () => {
          throw new Error('socket hang up');
        },
      }),
    ).rejects.toThrow('socket hang up');
    expect(end).toHaveBeenCalledOnce();
  });

  it('reports every item unsent when it cannot connect', async () => {
    expect(
      await overFiles({
        connect: async () => {
          throw new Error('ECONNREFUSED');
        },
        items: ['a.json', 'b.json'],
      }),
    ).toEqual(
      ['a.json', 'b.json'].map((file) =>
        reportOf({ file, problems: ['could not connect: ECONNREFUSED'] }),
      ),
    );
  });

  it('does not connect for no items', async () => {
    const connect = vi.fn();

    expect(await overFiles({ connect, items: [] })).toEqual([]);
    expect(connect).not.toHaveBeenCalled();
  });
});
