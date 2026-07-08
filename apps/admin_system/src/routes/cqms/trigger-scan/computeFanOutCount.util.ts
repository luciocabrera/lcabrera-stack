type ComputeFanOutCountArgs = {
  readonly scannerCount: number;
  readonly workspaceCount: number;
};

/**
 * Mirrors fn_create_run_with_scoped_scans' own fan-out rule (ADR-021): no
 * workspace selection means one whole-repo scan per scanner, otherwise one
 * scan per (scanner, workspace) pair.
 */
export const computeFanOutCount = ({
  scannerCount,
  workspaceCount,
}: ComputeFanOutCountArgs): number =>
  scannerCount * Math.max(workspaceCount, 1);
