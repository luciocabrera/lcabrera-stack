/**
 * The search param a drill request carries its group in.
 *
 * Single-sourced because the encoder and the parser are the two halves of one
 * codec (ADR-081); a param name spelled twice is the cheapest way for them to
 * stop agreeing.
 */
export const OLAP_DRILL_GROUP_PARAM = 'group';

/**
 * The row field a grouped read attaches its group summary to.
 *
 * A wire name: the server's grouped read writes it and the grid reads it, so it
 * belongs to the codec rather than to either end (ADR-081). `@lcabrera/ui`
 * re-declares it as `TABLE_GROUP_ROW_FIELD`, typed against its own row shape so
 * that renaming the field on one side is a compile error rather than a group
 * header that silently stops rendering.
 */
export const OLAP_GROUP_ROW_FIELD = 'tableGroup';
