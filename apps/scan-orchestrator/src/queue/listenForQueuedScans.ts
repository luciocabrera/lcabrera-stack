import { readEnvConfig } from '@repo/server/db/env.schema';
import { Client } from 'pg';

const NOTIFY_CHANNEL = 'cqms_scan_queued';
const RECONNECT_DELAY_MS = 2000;

type ListenForQueuedScansArgs = {
  readonly onWake: () => void;
};

const endClientQuietly = async (client: Client): Promise<void> => {
  try {
    await client.end();
  } catch {
    // The connection is already broken — there is nothing useful left to do
    // with a failure to close it; reconnection is already scheduled.
  }
};

/**
 * Holds one dedicated, non-pooled Postgres client LISTENing on
 * cqms_scan_queued (TECH_SPEC §2.7) — separate from scan-ingestion's
 * pooled query connections, since LISTEN requires keeping this exact
 * connection open for the process's whole lifetime. onWake is called on
 * every notification; the caller (processQueue) re-reads the actual
 * queued-scans table rather than trusting the notification payload as
 * anything more than "something changed, go look."
 */
export const listenForQueuedScans = ({
  onWake,
}: ListenForQueuedScansArgs): void => {
  const envConfig = readEnvConfig({ env: process.env });

  const connect = (): void => {
    const client = new Client({
      database: envConfig.DB_NAME,
      host: envConfig.DB_HOST,
      password: envConfig.DB_PASSWORD,
      port: envConfig.DB_PORT,
      user: envConfig.DB_USER,
    });

    client.on('notification', () => {
      onWake();
    });

    client.on('error', (error) => {
      console.error('❌ LISTEN connection error, reconnecting:', error);
      void endClientQuietly(client);
      setTimeout(connect, RECONNECT_DELAY_MS);
    });

    const establishListen = async (): Promise<void> => {
      try {
        await client.connect();
        await client.query(`LISTEN ${NOTIFY_CHANNEL}`);
        console.warn(`👂 Listening on Postgres channel "${NOTIFY_CHANNEL}"`);
      } catch (error) {
        console.error('❌ Failed to establish LISTEN connection:', error);
        setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };

    void establishListen();
  };

  connect();
};
