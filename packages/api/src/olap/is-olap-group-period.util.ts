import type { OlapGroupPeriod } from './olap.types';

import { OLAP_GROUP_PERIODS } from './olap.constants';

const PERIODS: ReadonlySet<string> = new Set(OLAP_GROUP_PERIODS);

/**
 * Both ends need it — the URL codec refuses a payload naming anything else, and the query
 * builder refuses one that reached it anyway — so it lives beside the vocabulary rather
 * than being written twice (ADR-082).
 */
export const isOlapGroupPeriod = (value: unknown): value is OlapGroupPeriod =>
  typeof value === 'string' && PERIODS.has(value);
