import type { SelectFilter, TextFilter } from '#ui/types/filterOperators.types';

import type { TextOrSelectFilterInputProps } from './TextOrSelectFilterInput.types';

import { SelectFilterInput } from '../../../SelectFilterInput';
import { TextFilterInput } from '../../../TextFilterInput';

export const TextOrSelectFilterInput = <TData,>({
  columnKey,
  filter,
  hasFetchableOptions,
  listMaxHeight,
  onChange,
  operator,
  shouldFillHeight,
}: TextOrSelectFilterInputProps<TData>) => {
  const shouldShowSelectList =
    hasFetchableOptions && (operator === 'equals' || operator === 'notEquals');

  const handleSelectChange = (selectFilter?: SelectFilter) => {
    if (selectFilter) {
      onChange({
        ...selectFilter,
        operator: operator === 'notEquals' ? 'notEquals' : 'equals',
      });
    } else {
      onChange();
    }
  };

  if (shouldShowSelectList) {
    return (
      <SelectFilterInput
        columnKey={columnKey}
        filter={
          filter?.type === 'select' || filter?.type === 'multiSelect'
            ? filter
            : undefined
        }
        listMaxHeight={listMaxHeight}
        onChange={handleSelectChange}
        shouldFillHeight={shouldFillHeight}
      />
    );
  }

  return (
    <TextFilterInput
      columnKey={columnKey}
      filter={filter as TextFilter}
      onChange={onChange}
      operator={operator}
    />
  );
};
