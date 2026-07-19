import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { isPathWithinSnapshotsRoot } from './isPathWithinSnapshotsRoot.util.ts';

describe('isPathWithinSnapshotsRoot', () => {
  const snapshotsRoot = path.resolve('/var/cqms-snapshots');

  it('accepts a path strictly inside the root', () => {
    expect(
      isPathWithinSnapshotsRoot({
        candidatePath: `${snapshotsRoot}/project/abc`,
        snapshotsRoot,
      }),
    ).toBe(true);
  });

  it('rejects the root itself (strict descendant only)', () => {
    expect(
      isPathWithinSnapshotsRoot({
        candidatePath: snapshotsRoot,
        snapshotsRoot,
      }),
    ).toBe(false);
  });

  it('rejects a sibling that merely shares the root as a name prefix', () => {
    expect(
      isPathWithinSnapshotsRoot({
        candidatePath: `${snapshotsRoot}-evil/x`,
        snapshotsRoot,
      }),
    ).toBe(false);
  });

  it('rejects a path outside the root', () => {
    expect(
      isPathWithinSnapshotsRoot({
        candidatePath: '/etc/passwd',
        snapshotsRoot,
      }),
    ).toBe(false);
  });

  it('rejects a `..` traversal that escapes the root', () => {
    expect(
      isPathWithinSnapshotsRoot({
        candidatePath: `${snapshotsRoot}/../etc`,
        snapshotsRoot,
      }),
    ).toBe(false);
  });

  it('resolves a relative root before comparing', () => {
    expect(
      isPathWithinSnapshotsRoot({
        candidatePath: 'snaps/child',
        snapshotsRoot: 'snaps',
      }),
    ).toBe(true);
  });
});
