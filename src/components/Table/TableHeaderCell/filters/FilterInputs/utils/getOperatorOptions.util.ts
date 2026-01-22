import type { TableColumnDataType } from '@/components/Table/Table.types';
import type {
  OperatorOption,
  OperatorType,
} from '@/types/filterOperators.types';

import {
  DATE_OPERATORS,
  NUMBER_OPERATORS,
  TEXT_OPERATORS,
} from '@/components/Table/constants';

export type GetOperatorOptionsParams = {
  dataType?: TableColumnDataType;
};

/**
 * Gets the available operator options based on column data type.
 */
export const getOperatorOptions = ({
  dataType,
}: GetOperatorOptionsParams): OperatorOption<OperatorType>[] => {
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
