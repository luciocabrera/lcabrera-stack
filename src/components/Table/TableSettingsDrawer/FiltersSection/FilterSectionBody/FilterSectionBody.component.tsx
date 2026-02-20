import { FilterInputs } from '@/components/Table/TableHeaderCell/filters/FilterInputs';

import type { FilterSectionBodyProps } from './FilterSectionBody.types';

/**
 * Thin wrapper around FilterInputs for the drawer.
 * Data fetching is handled internally by SelectFilterInput.
 */
export const FilterSectionBody = <TData,>({
  columnKey,
  filter,
  onChange,
}: FilterSectionBodyProps<TData>) => (
  <FilterInputs columnKey={columnKey} filter={filter} onChange={onChange} />
);
