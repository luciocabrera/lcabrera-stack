import { describe, expect, it } from 'vite-plus/test';

import { migrationDriftIssues } from './migrationDriftIssues.util.ts';

type FileArgs = {
  readonly sha256: string;
  readonly version: number;
};

const file = ({ sha256, version }: FileArgs) => ({
  name: `000${String(version)}-m.sql`,
  sha256,
  sql: '',
  version,
});

describe('migrationDriftIssues', () => {
  it('reports nothing when every applied file is unchanged', () => {
    expect(
      migrationDriftIssues({
        applied: [{ name: '0001-m.sql', sha256: 'a', version: 1 }],
        migrations: [
          file({ sha256: 'a', version: 1 }),
          file({ sha256: 'b', version: 2 }),
        ],
      }),
    ).toEqual([]);
  });

  it('names an applied file whose checksum changed', () => {
    expect(
      migrationDriftIssues({
        applied: [{ name: '0001-m.sql', sha256: 'a', version: 1 }],
        migrations: [file({ sha256: 'edited', version: 1 })],
      }),
    ).toEqual([{ name: '0001-m.sql', reason: 'changed' }]);
  });

  it('names an applied file that is gone', () => {
    expect(
      migrationDriftIssues({
        applied: [{ name: '0001-m.sql', sha256: 'a', version: 1 }],
        migrations: [],
      }),
    ).toEqual([{ name: '0001-m.sql', reason: 'missing' }]);
  });

  it('names a pending file numbered below one already applied', () => {
    expect(
      migrationDriftIssues({
        applied: [{ name: '0002-m.sql', sha256: 'b', version: 2 }],
        migrations: [
          file({ sha256: 'a', version: 1 }),
          file({ sha256: 'b', version: 2 }),
        ],
      }),
    ).toEqual([{ name: '0001-m.sql', reason: 'out-of-order' }]);
  });
});
