import type { IngestReport } from './ingest.types.ts';

type UnsentWarningArgs = {
  readonly database: string;
  readonly reports: readonly IngestReport[];
};

export const unsentWarning = ({ database, reports }: UnsentWarningArgs) => {
  const unsent = reports.filter(({ result }) => result === 'unsent');

  return unsent.length === 0
    ? []
    : [
        `evals:ingest: ${database} is unreachable; ${String(unsent.length)} envelope(s) stay on disk until \`vp run evals:ingest\` sends them`,
      ];
};
