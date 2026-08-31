import { PERIOD_CAPABLE_TYPE_NAMES } from './group-query-builder.constants.ts';

type IsPeriodCapableTypeArgs = {
  readonly typeName: string;
  readonly typeNamespace: string;
};

export const isPeriodCapableType = ({
  typeName,
  typeNamespace,
}: IsPeriodCapableTypeArgs) =>
  PERIOD_CAPABLE_TYPE_NAMES.has(`${typeNamespace}.${typeName}`);
