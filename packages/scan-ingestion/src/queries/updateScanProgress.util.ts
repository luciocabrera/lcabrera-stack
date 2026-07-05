import { getPool } from '@repo/data-access/db/getPool.util';

type UpdateScanProgressArgs = {
  readonly progressMessage: string;
  readonly scanId: string;
};

/** Backs runSkillAgent's onProgress callback (TECH_SPEC §2.6/§2.7) — surfaced live via the WebSocket push, not just polled on next page load. */
export const updateScanProgress = async ({
  progressMessage,
  scanId,
}: UpdateScanProgressArgs): Promise<void> => {
  const pool = getPool();
  await pool.query(
    'UPDATE cqms.scans SET progress_message = $2 WHERE id = $1',
    [scanId, progressMessage],
  );
};
