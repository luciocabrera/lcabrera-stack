import type { TextFilter } from '../../../Table.types';

export type TextFilterInputProps = {
  filter: null | TextFilter | undefined;
  onChange: (filter: null | TextFilter | undefined) => void;
  onOperatorChange?: (operator: TextFilter['operator']) => void;
};
