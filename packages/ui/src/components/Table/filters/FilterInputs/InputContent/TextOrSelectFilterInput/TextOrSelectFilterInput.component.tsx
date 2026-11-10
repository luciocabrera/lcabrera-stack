import type { SelectFilter, TextFilter } from '#ui/types/filterOperators.types';

import type { TextOrSelectFilterInputProps } from './TextOrSelectFilterInput.types';

import { SelectFilterInput } from '../../../SelectFilterInput';
import { TextFilterInput } from '../../../TextFilterInput';
import { shouldShowSelectList } from '../../utils';

export const TextOrSelectFilterInput = <TData,>({
  columnKey,
  filter,
  hasFetchableOptions,
  listMaxHeight,
  onChange,
  operator,
  shouldFillHeight,
}: TextOrSelectFilterInputProps<TData>) => {
  const isSelectList = shouldShowSelectList({ hasFetchableOptions, operator });

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

  if (isSelectList) {
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
