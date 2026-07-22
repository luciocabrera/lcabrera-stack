import { closePool } from '@lcabrera/server/db/get-pool.util';
import { registerShutdownSignals } from '@repo/node-runtime/registerShutdownSignals.util';
import { failStaleRunningScans } from '@repo/scan-ingestion/queries/failStaleRunningScans.util';
import { getUserByUsername } from '@repo/scan-ingestion/queries/getUserByUsername.util';

import { readEnvConfig } from './config/env.schema.ts';
import { listenForQueuedScans } from './queue/listenForQueuedScans.ts';
import { createQueueProcessor } from './queue/processQueue.ts';
import { attachWebSocketServer } from './ws/attachWebSocketServer.ts';
import { createHttpServer } from './ws/createHttpServer.ts';
import { createRunStatusHub } from './ws/runStatusHub.ts';

const RECONCILE_INTERVAL_MS = 30_000;
const SYSTEM_USERNAME = 'system';

const envConfig = readEnvConfig({ env: process.env });

const hub = createRunStatusHub();
const queueProcessor = createQueueProcessor({
  dailyCapUsd: envConfig.LLM_DAILY_COST_CAP_USD,
  hub,
  maxConcurrentScans: envConfig.MAX_CONCURRENT_SCANS,
});

const httpServer = createHttpServer();
attachWebSocketServer({
  httpServer,
  hub,
  ticketSecret: envConfig.CQMS_WS_TICKET_SECRET,
});

httpServer.listen(envConfig.SCAN_ORCHESTRATOR_PORT, '0.0.0.0', () => {
  console.warn(
    `🚀 scan-orchestrator running at http://localhost:${envConfig.SCAN_ORCHESTRATOR_PORT} (ws: /ws/runs)`,
  );
});

// Startup reconciliation BEFORE any listening/claiming begins (ADR-026):
// a scan left at 'running' by a previous process that died mid-run would
// otherwise stay 'running' forever — at this point in the lifecycle no
// claim has been made yet, so every 'running' row is necessarily stale
// (single active orchestrator, ADR-015). Clients learn of the failure via
// normal revalidation; there are no WS subscribers this early.
const reconcileStaleScansAtStartup = async (): Promise<void> => {
  const systemUser = await getUserByUsername({ username: SYSTEM_USERNAME });
  if (systemUser === undefined) {
    throw new Error(
      "The seeded 'system' user was not found — run migrations first.",
    );
  }
  const sweptCount = await failStaleRunningScans({ userId: systemUser.id });
  if (sweptCount > 0) {
    console.warn(
      `🧹 Failed ${sweptCount} stale 'running' scan(s) left by a previous orchestrator process.`,
    );
  }
};

// NOTIFY-driven wake-ups for near-zero latency, plus a reconciliation poll
// as the durability backstop (NOTIFY is fire-and-forget, not persisted —
// TECH_SPEC §2.7) and one drain immediately on startup, in case scans were
// queued while this process was down entirely.
let reconcileInterval: NodeJS.Timeout | undefined;

try {
  await reconcileStaleScansAtStartup();
  listenForQueuedScans({ onWake: queueProcessor.wake });
  reconcileInterval = setInterval(queueProcessor.wake, RECONCILE_INTERVAL_MS);
  queueProcessor.wake();
} catch (error: unknown) {
  console.error('❌ Failed to start the scan queue:', error);
  process.exitCode = 1;
  httpServer.close();
}

const shutdown = async (): Promise<void> => {
  console.warn('🛑 Shutting down scan-orchestrator');
  clearInterval(reconcileInterval);
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  await closePool();
};

registerShutdownSignals({ shutdown });
