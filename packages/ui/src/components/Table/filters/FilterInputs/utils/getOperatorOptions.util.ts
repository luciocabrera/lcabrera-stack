import type { TableColumnDataType } from '#ui/components/Table/Table.types';

import {
  DATE_OPERATORS,
  EMPTY_OPERATORS,
  NUMBER_OPERATORS,
  TEXT_OPERATORS,
} from '#ui/constants/filterOperators.constants';

export type GetOperatorOptionsParams = {
  readonly dataType?: TableColumnDataType;
};

/**
 * Gets the available operator options based on column data type.
 *
 * The empty operators are appended to every list rather than being a family of
 * their own: any column can hold no value, so "is empty" is a question worth
 * asking of all of them, and it is the column's data type that decides which
 * *comparisons* make sense — not whether emptiness does.
 */
export const getOperatorOptions = ({ dataType }: GetOperatorOptionsParams) => {
  switch (dataType) {
    case 'currency':
    case 'number': {
      return [...NUMBER_OPERATORS, ...EMPTY_OPERATORS];
    }
    case 'date': {
      return [...DATE_OPERATORS, ...EMPTY_OPERATORS];
    }
    default: {
      return [...TEXT_OPERATORS, ...EMPTY_OPERATORS];
    }
  }
};
