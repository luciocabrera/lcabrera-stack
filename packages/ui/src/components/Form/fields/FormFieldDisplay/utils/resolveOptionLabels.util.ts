import type { FieldOption } from '#ui/components/Form/Form.types';

import { stringifyLeafValue } from './stringifyLeafValue.util';

type ResolveOptionLabelsArgs = {
  readonly options: readonly FieldOption[];
  readonly value: unknown;
};

export const resolveOptionLabels = ({
  options,
  value,
}: ResolveOptionLabelsArgs) => {
  const toLabel = (item: unknown) =>
    options.find((option) => option.value === item)?.label ??
    stringifyLeafValue(item);

  if (Array.isArray(value)) {
    return value.map((item) => toLabel(item)).join(', ');
  }

  if (value === undefined || value === '') {
    return '';
  }

  return toLabel(value);
};
