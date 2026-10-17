type MissingRunsProblemArgs = {
  readonly baselineId: string;
  readonly found: number;
  readonly paths: readonly string[];
  readonly runs: number;
};

export const missingRunsProblem = ({
  baselineId,
  found,
  paths,
  runs,
}: MissingRunsProblemArgs) =>
  found < runs
    ? `${String(runs - found)} of ${String(runs)} runs left no envelope for baseline ${baselineId} under ${paths.join(', ')}, so a runner failed before recording`
    : undefined;
