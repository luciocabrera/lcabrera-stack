import type { TextFilter } from '../../../Table.types';

export type TextFilterInputProps = {
  filter?: TextFilter | undefined;
  onChange: (filter?: TextFilter) => void;
  onOperatorChange?: (operator: TextFilter['operator']) => void;
};
