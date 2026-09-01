import type { OlapGroupPeriod } from './olap.types';

import { OLAP_GROUP_PERIODS } from './olap.constants';

const PERIODS: ReadonlySet<string> = new Set(OLAP_GROUP_PERIODS);

export const isOlapGroupPeriod = (value: unknown): value is OlapGroupPeriod =>
  typeof value === 'string' && PERIODS.has(value);
