import type { OlapGroupPeriod } from './olap.types';

/**
 * The search param a drill request carries its group in.
 *
 * Single-sourced because the encoder and the parser are the two halves of one
 * codec (ADR-082); a param name spelled twice is the cheapest way for them to
 * stop agreeing.
 */
export const OLAP_DRILL_GROUP_PARAM = 'group';

/**
 * The row field a grouped read attaches its group summary to.
 *
 * A wire name: the server's grouped read writes it and the grid reads it, so it
 * belongs to the codec rather than to either end (ADR-082). `@lcabrera/ui`
 * re-declares it as `TABLE_GROUP_ROW_FIELD`, typed against its own row shape so
 * that renaming the field on one side is a compile error rather than a group
 * header that silently stops rendering.
 */
export const OLAP_GROUP_ROW_FIELD = 'tableGroup';

/**
 * The granularities offered, coarsening left to right. The order is the order a
 * surface lists them in and the order a refusal walks when it suggests the next
 * one up, so it is meaningful rather than alphabetical.
 */
export const OLAP_GROUP_PERIODS: readonly OlapGroupPeriod[] = [
  'day',
  'month',
  'quarter',
  'year',
];
