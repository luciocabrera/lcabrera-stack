/**
 * The search param a drill request carries its group in.
 *
 * Single-sourced because the encoder and the parser are the two halves of one
 * codec (ADR-081); a param name spelled twice is the cheapest way for them to
 * stop agreeing.
 */
export const OLAP_DRILL_GROUP_PARAM = 'group';
