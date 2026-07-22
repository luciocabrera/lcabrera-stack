import { hostname } from 'node:os';
import { z } from 'zod';

// Relative same-package imports (see ingest.cli.ts) — this file runs directly
// via `node --experimental-strip-types`, outside Vite/tsc's module graph, so
// the @repo/scan-ingestion/* self-alias would not resolve.
import { packProjectArchive } from '../ingestion/snapshots/packProjectArchive.util.ts';
import { parseCliFlags } from './parseCliFlags.util.ts';
import { stripTrailingSlashes } from './stripTrailingSlashes.util.ts';

const pushResultSchema = z.object({
  fileCount: z.number(),
  sizeBytes: z.number(),
  snapshotId: z.string(),
});

const printUsage = (): void => {
  console.error(
    'Usage: push.cli.ts --project-id=<uuid> [--url=<server>] [--root=<dir>]\n' +
      '  token from CODEPULSE_TOKEN env (or --token=<token>, discouraged — shell history)\n' +
      '  url   from CODEPULSE_URL env when --url is omitted',
  );
};

const run = async (): Promise<void> => {
  const flags = parseCliFlags(process.argv.slice(2));
  const projectId = flags['project-id'];
  const serverUrl = flags.url ?? process.env.CODEPULSE_URL;
  const bearer = flags.token ?? process.env.CODEPULSE_TOKEN;
  const rootPath = flags.root ?? process.cwd();

  if (!projectId || !serverUrl || !bearer) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const { archiveBytes, fileCount } = packProjectArchive({ rootPath });
  console.warn(`📦 Packed ${fileCount} files from ${rootPath}`);

  const endpoint = `${stripTrailingSlashes(serverUrl)}/_action/push-snapshot/${projectId}`;
  const response = await fetch(endpoint, {
    body: archiveBytes,
    headers: {
      Authorization: `Bearer ${bearer}`,
      'Content-Type': 'application/zip',
      'X-CodePulse-Host': hostname(),
    },
    method: 'POST',
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Push rejected (${response.status}): ${detail}`);
  }

  const result = pushResultSchema.parse(await response.json());
  console.warn(
    `✅ Synced snapshot ${result.snapshotId} — ${result.fileCount} files, ${result.sizeBytes} bytes`,
  );
};

try {
  await run();
} catch (error: unknown) {
  console.error('❌ Push failed:', error);
  process.exitCode = 1;
}
