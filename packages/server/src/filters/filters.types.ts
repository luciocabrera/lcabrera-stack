/**
 * The column-filter shapes `toQueryFilters` maps to query filters. They are declared once in
 * `@lcabrera/api`, beside the parse that reads them off a request, and re-exported here so the
 * shape a client serialises and the shape this package maps cannot drift apart.
 */

export type {
  BooleanFilter,
  ColumnFilter,
  DateFilter,
  EmptyFilter,
  NumberFilter,
  SelectFilter,
  TextFilter,
} from '@lcabrera/api/filters/filters.types';
