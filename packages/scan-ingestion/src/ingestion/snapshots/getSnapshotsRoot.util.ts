import os from 'node:os';
import path from 'node:path';
import { z } from 'zod';

const envSchema = z.object({
  CQMS_SNAPSHOTS_DIR: z.string().min(1).optional(),
});

/**
 * Root directory for project snapshot storage (ADR-028). Every snapshot
 * unpacks to `<root>/<projectId>/<random>/`; nothing outside this root is
 * ever written to or deleted by the snapshot layer — deletion of a
 * replaced snapshot is guarded on its path living under this root.
 * Zod-validated env (never raw process.env reads), OS-tmpdir default for
 * zero-config local dev.
 */
export const getSnapshotsRoot = () => {
  const env = envSchema.parse(process.env);
  return env.CQMS_SNAPSHOTS_DIR ?? path.join(os.tmpdir(), 'cqms-snapshots');
};
