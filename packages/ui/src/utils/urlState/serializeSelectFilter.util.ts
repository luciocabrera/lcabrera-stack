import type { ColumnFilter } from '#ui/types/filterOperators.types';

type SerializeSelectFilterArgs = {
  readonly filter: Extract<
    ColumnFilter,
    { readonly type: 'multiSelect' | 'select' }
  >;
};

export const serializeSelectFilter = ({
  filter,
}: SerializeSelectFilterArgs) => {
  const values = filter.values ?? (filter.value ? [filter.value] : []);

  return filter.operator === 'notEquals' ? ['!', ...values] : values;
};
