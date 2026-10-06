import { describe, expect, it } from 'vite-plus/test';

import type { MigrationClient } from '../migrate/migrate.types.ts';

import {
  SYNTHETIC_HISTORY_STATEMENTS,
  SYNTHETIC_PRIVATE_TEXT,
  SYNTHETIC_SHAPE,
} from './seed.constants.ts';
import { seedSyntheticHistory } from './seedSyntheticHistory.service.ts';

type FakeArgs = {
  readonly failOn?: string;
  readonly runsBefore: number;
};

const fakeClient = ({ failOn, runsBefore }: FakeArgs) => {
  const sent: { readonly text: string; readonly values?: unknown[] }[] = [];
  const client: MigrationClient = {
    query: async (query) => {
      sent.push(query);

      if (query.text === failOn) {
        throw new Error('statement failed');
      }

      const isSeeded = sent.some(
        ({ text }) => text === SYNTHETIC_HISTORY_STATEMENTS.at(-1),
      );

      return {
        rows: query.text.includes('count(*)')
          ? [
              isSeeded
                ? { runs: 365, trials: 15_330 }
                : { runs: runsBefore, trials: 0 },
            ]
          : [],
      };
    },
  };

  return { client, sent };
};

describe('seedSyntheticHistory', () => {
  it('runs every statement in one transaction with the shape and the end date bound', async () => {
    const { client, sent } = fakeClient({ runsBefore: 0 });

    expect(
      await seedSyntheticHistory({ client, endsOn: '2026-10-01' }),
    ).toEqual({
      runs: 365,
      trials: 15_330,
    });
    expect(sent.at(0)?.text).toBe('begin');
    expect(sent.at(-1)?.text).toBe('commit');
    expect(
      sent.filter(({ text }) => SYNTHETIC_HISTORY_STATEMENTS.includes(text)),
    ).toEqual(
      SYNTHETIC_HISTORY_STATEMENTS.map((text) => ({
        text,
        values: [
          '2026-10-01',
          SYNTHETIC_SHAPE.nights,
          SYNTHETIC_SHAPE.subjects,
          SYNTHETIC_SHAPE.trialsPerTask,
          SYNTHETIC_PRIVATE_TEXT,
        ],
      })),
    );
  });

  it('refuses a database that already holds runs and writes nothing', async () => {
    const { client, sent } = fakeClient({ runsBefore: 2 });

    await expect(
      seedSyntheticHistory({ client, endsOn: '2026-10-01' }),
    ).rejects.toThrow(/already holds 2 runs/);
    expect(sent.at(-1)?.text).toBe('rollback');
    expect(
      sent.some(({ text }) => SYNTHETIC_HISTORY_STATEMENTS.includes(text)),
    ).toBe(false);
  });

  it('rolls back when a statement fails', async () => {
    const { client, sent } = fakeClient({
      failOn: SYNTHETIC_HISTORY_STATEMENTS[2],
      runsBefore: 0,
    });

    await expect(
      seedSyntheticHistory({ client, endsOn: '2026-10-01' }),
    ).rejects.toThrow('statement failed');
    expect(sent.at(-1)?.text).toBe('rollback');
  });
});
