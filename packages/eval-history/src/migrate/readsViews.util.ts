import type { EvalsRole } from './migrate.types.ts';

import { VIEWS_TARGET } from './migrate.constants.ts';

export const readsViews = ({ grants }: EvalsRole) =>
  grants.some(({ on }) => VIEWS_TARGET.test(on));
