import type {
  SelectFilter,
  TextFilter,
} from '@repo/ui/types/filterOperators.types';

import type { TextOrSelectFilterInputProps } from './TextOrSelectFilterInput.types';

import { SelectFilterInput } from '../../../SelectFilterInput';
import { TextFilterInput } from '../../../TextFilterInput';

/**
 * Text-typed filter input: renders a select list when the column has
 * fetchable options and the operator is an (in)equality, otherwise a free
 * text input. Owns the select→text operator mapping on change. Private
 * delegate of `InputContent` — keeps its `switch (dataType)` pure dispatch.
 */
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
