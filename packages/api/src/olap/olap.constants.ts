import type { OlapGroupPeriod } from './olap.types';

export const OLAP_DRILL_GROUP_PARAM = 'group';

export const OLAP_GROUP_ROW_FIELD = 'tableGroup';

export const OLAP_GROUP_PERIODS: readonly OlapGroupPeriod[] = [
  'day',
  'month',
  'quarter',
  'year',
];
