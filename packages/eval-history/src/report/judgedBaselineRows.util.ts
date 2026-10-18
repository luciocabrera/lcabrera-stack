import type { ScoredBaselineRow } from './report.types.ts';

import { subjectKey } from './subjectKey.util.ts';

type JudgedBaselineRowsArgs = {
  readonly baseline: readonly ScoredBaselineRow[];
  readonly subjects: ReadonlySet<string>;
};

export const judgedBaselineRows = ({
  baseline,
  subjects,
}: JudgedBaselineRowsArgs) => {
  const perSubject = baseline.filter(
    ({ subject }) => subject !== undefined && subjects.has(subjectKey(subject)),
  );
  const subjectRows = baseline.filter(({ subject }) => subject !== undefined);
  const isEverySubjectJudged = perSubject.length === subjectRows.length;

  return [
    ...(isEverySubjectJudged
      ? baseline.filter(({ subject }) => subject === undefined)
      : []),
    ...perSubject,
  ];
};
