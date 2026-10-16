import type { Outcome } from '../stats/stats.types.ts';

import { hasPassAtK } from '../stats/hasPassAtK.util.ts';
import { hasPassHatK } from '../stats/hasPassHatK.util.ts';

type IsFlipArgs = {
  readonly after: readonly Outcome[] | undefined;
  readonly before: readonly Outcome[] | undefined;
};

export const isFlip = ({ after, before }: IsFlipArgs) =>
  before === undefined ||
  after === undefined ||
  hasPassAtK(before) !== hasPassAtK(after) ||
  hasPassHatK(before) !== hasPassHatK(after);
