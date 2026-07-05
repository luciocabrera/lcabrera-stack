import { closePool } from '@repo/data-access/db/getPool.util';

import { readEnvConfig } from './config/env.schema.ts';
import { listenForQueuedScans } from './queue/listenForQueuedScans.ts';
import { createQueueProcessor } from './queue/processQueue.ts';
import { attachWebSocketServer } from './ws/attachWebSocketServer.ts';
import { createHttpServer } from './ws/createHttpServer.ts';
import { createRunStatusHub } from './ws/runStatusHub.ts';

const RECONCILE_INTERVAL_MS = 30_000;

const envConfig = readEnvConfig({ env: process.env });

const hub = createRunStatusHub();
const queueProcessor = createQueueProcessor({ hub });

const httpServer = createHttpServer();
attachWebSocketServer({ hub, httpServer });

httpServer.listen(envConfig.SCAN_ORCHESTRATOR_PORT, '0.0.0.0', () => {
  console.warn(
    `🚀 scan-orchestrator running at http://localhost:${envConfig.SCAN_ORCHESTRATOR_PORT} (ws: /ws/runs)`,
  );
});

// NOTIFY-driven wake-ups for near-zero latency, plus a reconciliation poll
// as the durability backstop (NOTIFY is fire-and-forget, not persisted —
// TECH_SPEC §2.7) and one drain immediately on startup, in case scans were
// queued while this process was down entirely.
listenForQueuedScans({ onWake: queueProcessor.wake });
const reconcileInterval = setInterval(
  queueProcessor.wake,
  RECONCILE_INTERVAL_MS,
);
queueProcessor.wake();

const shutdown = async (): Promise<void> => {
  console.warn('🛑 Shutting down scan-orchestrator');
  clearInterval(reconcileInterval);
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  await closePool();
};

process.on('SIGINT', () => {
  void shutdown().catch((error: unknown) => {
    console.error('❌ Error during SIGINT shutdown:', error);
  });
});

process.on('SIGTERM', () => {
  void shutdown().catch((error: unknown) => {
    console.error('❌ Error during SIGTERM shutdown:', error);
  });
});
