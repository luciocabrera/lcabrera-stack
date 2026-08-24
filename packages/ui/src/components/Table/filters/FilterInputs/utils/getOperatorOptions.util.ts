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
