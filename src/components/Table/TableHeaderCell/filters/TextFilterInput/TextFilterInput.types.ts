import type { TextFilter } from '../../../Table.types';

export type TextFilterInputProps = {
  filter: TextFilter | undefined;
  onChange: (filter: TextFilter | undefined) => void;
  onOperatorChange?: (operator: TextFilter['operator']) => void;
};
