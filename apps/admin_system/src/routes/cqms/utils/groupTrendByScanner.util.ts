import type { ProjectScannerTrendRow } from '@repo/scan-ingestion/queries/getProjectScannerTrend.util';

export type ScannerTrendGroup = {
  readonly highCounts: readonly number[];
  readonly scannerId: string;
};

/**
 * Groups `project_scanner_trend` rows (already chronological, per
 * TECH_SPEC §2.3a's `ORDER BY ... created_at`) by scanner, extracting just
 * `high_count` for `TrendSparkline` — one sparkline per scanner.
 */
export const groupTrendByScanner = (
  rows: readonly ProjectScannerTrendRow[],
): readonly ScannerTrendGroup[] => {
  const groups = new Map<string, number[]>();

  for (const row of rows) {
    const existing = groups.get(row.scanner_id);
    const highCount = row.high_count ?? 0;

    if (existing) {
      existing.push(highCount);
    } else {
      groups.set(row.scanner_id, [highCount]);
    }
  }

  return [...groups].map(([scannerId, highCounts]) => ({
    highCounts,
    scannerId,
  }));
};
