import type { HashEntry, ReportRun } from './report.types.ts';

import { SCOPED_HASH_PREFIXES } from './report.constants.ts';

export const subjectHashes = ({ subjects }: Pick<ReportRun, 'subjects'>) =>
  subjects.map(({ contentHash, kind, name }): HashEntry => [
    `${SCOPED_HASH_PREFIXES.content}${kind}/${name}`,
    contentHash,
  ]);
