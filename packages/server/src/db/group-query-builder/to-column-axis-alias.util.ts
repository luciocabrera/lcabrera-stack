type ToColumnAxisAliasArgs = {
  readonly alias: string;
  readonly index: number;
};

export const toColumnAxisAlias = ({ alias, index }: ToColumnAxisAliasArgs) =>
  `${alias}_c${index}`;
