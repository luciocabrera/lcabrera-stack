import { tokenOffsets } from './tokenOffsets.util.ts';

type TableAliasesArgs = {
  readonly definition: string;
  readonly table: string;
};

const FOLLOWING_WORD = /^\s+(\w+)/u;

const CLAUSE_WORDS = new Set([
  'cross',
  'full',
  'group',
  'inner',
  'join',
  'left',
  'limit',
  'natural',
  'on',
  'order',
  'right',
  'union',
  'where',
]);

export const tableAliases = ({ definition, table }: TableAliasesArgs) => {
  const token = `evals.${table}`;
  const aliases = tokenOffsets({ text: definition, token }).map((start) => {
    const alias = FOLLOWING_WORD.exec(
      definition.slice(start + token.length),
    )?.[1];

    return alias === undefined || CLAUSE_WORDS.has(alias.toLowerCase())
      ? table
      : alias;
  });

  return [...new Set(aliases)];
};
