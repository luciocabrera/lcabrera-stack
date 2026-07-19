import type { FieldOption } from '@repo/ui/components/Form/Form.types';

import { stringifyLeafValue } from './stringifyLeafValue.util';

type ResolveOptionLabelsArgs = {
  readonly options: readonly FieldOption[];
  readonly value: unknown;
};

/**
 * Resolves a select/radio field's stored value(s) to their human-readable
 * option label(s) for read-only display — a single value maps to its option
 * label, an array (multi-select) maps to a comma-joined list, and any value
 * with no matching option falls back to its own string form.
 */
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
