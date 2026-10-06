import { describe, expect, it } from 'vite-plus/test';

import { MigrationDriftError } from './migrationDrift.error.ts';

describe('MigrationDriftError', () => {
  it('names every drifted file and why', () => {
    const issues = [
      { name: '0001-schema.sql', reason: 'changed' },
      { name: '0002-gone.sql', reason: 'missing' },
      { name: '0003-late.sql', reason: 'out-of-order' },
    ] as const;
    const error = new MigrationDriftError(issues);

    expect(error.name).toBe('MigrationDriftError');
    expect(error.issues).toBe(issues);
    expect(error.message).toContain(
      '0001-schema.sql changed since it was applied',
    );
    expect(error.message).toContain(
      '0002-gone.sql was applied but its file is gone',
    );
    expect(error.message).toContain(
      '0003-late.sql is numbered below a migration already applied',
    );
  });
});
