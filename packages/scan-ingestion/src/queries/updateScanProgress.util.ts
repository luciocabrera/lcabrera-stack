import { getPool } from '@lcabrera/server/db/get-pool.util';

type UpdateScanProgressArgs = {
  readonly progressMessage: string;
  readonly scanId: string;
  readonly userId: string;
};

/** Backs runSkillAgent's onProgress callback (TECH_SPEC §2.6/§2.7) — surfaced live via the WebSocket push, not just polled on next page load. */
export const updateScanProgress = async ({
  progressMessage,
  scanId,
  userId,
}: UpdateScanProgressArgs): Promise<void> => {
  const pool = getPool();
  await pool.query('SELECT cqms.fn_update_scan_progress($1, $2, $3)', [
    userId,
    scanId,
    progressMessage,
  ]);
};
