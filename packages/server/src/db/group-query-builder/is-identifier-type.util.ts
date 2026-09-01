import { IDENTIFIER_TYPE_NAMES } from './group-query-builder.constants.ts';

type IsIdentifierTypeArgs = {
  readonly typeName: string;
  readonly typeNamespace: string;
};

export const isIdentifierType = ({
  typeName,
  typeNamespace,
}: IsIdentifierTypeArgs) =>
  IDENTIFIER_TYPE_NAMES.has(`${typeNamespace}.${typeName}`);
