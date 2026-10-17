import type { TaskCount } from './report.types.ts';

import { ABSENT_CELL } from './report.constants.ts';

export const flipCell = (count: TaskCount | undefined) => {
  if (count === undefined) {
    return ABSENT_CELL;
  }

  const uncounted =
    count.excluded === 0 ? '' : ` (+${String(count.excluded)} not counted)`;

  return `${String(count.k)}/${String(count.n)}${uncounted}`;
};
