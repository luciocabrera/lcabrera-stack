import type { OlapGroupReadRefusal } from './olap.types';

/** Shared by every resolver that refuses, so two surfaces cannot disagree (ADR-094). */
export const GROUP_READ_REFUSAL_MESSAGE: Readonly<
  Record<OlapGroupReadRefusal, string>
> = {
  absent: 'This page opens one group’s rows, and the link does not say which.',
  'grand-total':
    'A grand total already summarises every row, so there is no narrower set to open.',
  'incomplete-path':
    'This group is named by fewer keys than the view was grouped by, so the rows underneath it are not the rows it counted.',
  malformed: 'This link does not name a group that can be opened.',
  subtotal:
    'A subtotal summarises the groups above it rather than rows of its own.',
};
