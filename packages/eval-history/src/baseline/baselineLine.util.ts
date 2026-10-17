import type { BaselineRow } from './baseline.types.ts';

const subjectName = ({ subject, suite }: BaselineRow) =>
  subject === undefined ? `suite ${suite}` : `${subject.kind} ${subject.name}`;

export const baselineLine = (row: BaselineRow) =>
  `${subjectName(row)} ${row.metric}: mean ${row.mean.toFixed(4)}, sd ${row.stddev.toFixed(4)} over ${String(row.nRuns)} runs`;
