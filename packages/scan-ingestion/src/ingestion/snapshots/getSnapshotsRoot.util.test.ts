import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { getSnapshotsRoot } from './getSnapshotsRoot.util.ts';

describe('getSnapshotsRoot', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns the CQMS_SNAPSHOTS_DIR env override when set', () => {
    vi.stubEnv('CQMS_SNAPSHOTS_DIR', '/srv/codepulse/snapshots');

    expect(getSnapshotsRoot()).toBe('/srv/codepulse/snapshots');
  });

  it('defaults to a cqms-snapshots dir under the OS tmpdir', () => {
    delete process.env.CQMS_SNAPSHOTS_DIR;

    expect(getSnapshotsRoot()).toBe(path.join(os.tmpdir(), 'cqms-snapshots'));
  });
});
