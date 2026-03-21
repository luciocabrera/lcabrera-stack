import type { TableColumnDataType } from '@/components/Table/Table.types';

import {
  DATE_OPERATORS,
  NUMBER_OPERATORS,
  TEXT_OPERATORS,
} from '@/constants/filterOperators.constants';

export type GetOperatorOptionsParams = {
  readonly dataType?: TableColumnDataType;
};

/**
 * Gets the available operator options based on column data type.
 */
export const getOperatorOptions = ({ dataType }: GetOperatorOptionsParams) => {
  switch (dataType) {
    case 'currency':
    case 'number': {
      return NUMBER_OPERATORS;
    }
    case 'date': {
      return DATE_OPERATORS;
    }
    default: {
      return TEXT_OPERATORS;
    }
  }
};
