import { elementFieldReads } from './elementFieldReads.util.ts';
import { tableAliases } from './tableAliases.util.ts';
import { tokenOffsets } from './tokenOffsets.util.ts';

type JsonbFieldReadsArgs = {
  readonly column: string;
  readonly definition: string;
};

const STEP = /^\s*(->>?)\s*'([^']+)'(?:::text)?/u;

const ARRAY_ELEMENTS_OPEN = /jsonb_array_elements\([\s(]*$/u;

const ARRAY_ELEMENTS_ALIAS = /^\s*\)[\s)]*\s(\w+)\((\w+)\)/u;

export const jsonbFieldReads = ({
  column,
  definition,
}: JsonbFieldReadsArgs) => {
  const [table = '', name = ''] = column.split('.', 2);

  return tableAliases({ definition, table }).flatMap((alias) => {
    const token = `${alias}.${name}`;

    return tokenOffsets({ text: definition, token }).flatMap((start) => {
      const after = definition.slice(start + token.length);
      const step = STEP.exec(after);

      if (step === null) {
        return [column];
      }

      const [taken, operator, key] = step;
      const path = `${column}.${key}`;
      const elements = ARRAY_ELEMENTS_ALIAS.exec(after.slice(taken.length));

      if (
        operator === '->' &&
        elements !== null &&
        ARRAY_ELEMENTS_OPEN.test(definition.slice(0, start))
      ) {
        return elementFieldReads({
          definition,
          element: `${elements[1]}.${elements[2]}`,
          path,
        });
      }

      return [path];
    });
  });
};
