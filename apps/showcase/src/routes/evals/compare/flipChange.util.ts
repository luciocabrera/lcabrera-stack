import type { taskVerdict } from './taskVerdict.util';

type FlipChangeArgs = {
  readonly after: Verdict;
  readonly before: Verdict;
};

type Verdict = ReturnType<typeof taskVerdict>;

const RANK: Readonly<Partial<Record<Verdict, number>>> = {
  fail: 0,
  mixed: 1,
  pass: 2,
};

export const flipChange = ({ after, before }: FlipChangeArgs) => {
  const from = RANK[before];
  const to = RANK[after];

  if (from === undefined || to === undefined) {
    return 'changed' as const;
  }

  return to < from ? ('regressed' as const) : ('improved' as const);
};
