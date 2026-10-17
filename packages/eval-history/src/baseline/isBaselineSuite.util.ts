import type { BaselineSuite } from './baseline.types.ts';

import { BASELINE_SUITES } from './baseline.constants.ts';

const KNOWN_SUITES = new Set<string>(BASELINE_SUITES);

export const isBaselineSuite = (suite: string): suite is BaselineSuite =>
  KNOWN_SUITES.has(suite);
