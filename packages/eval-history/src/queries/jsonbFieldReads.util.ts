import { elementFieldReads } from './elementFieldReads.util.ts';
import { tableAliases } from './tableAliases.util.ts';
import { tokenOffsets } from './tokenOffsets.util.ts';

type JsonbFieldReadsArgs = {
  readonly column: string;
  readonly definition: string;
};

const STEP = /^\s*(->>?)\s*'([^']+)'(?:::text)?/u;

const ARRAY_ELEMENTS_CALL = 'jsonb_array_elements(';

const CLOSING = /^[\s)]+/u;

const ELEMENT_ALIAS = /^(\w+)\((\w+)\)/u;

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
      const rest = after.slice(taken.length);
      const closing = CLOSING.exec(rest)?.[0] ?? '';
      const elements = closing.includes(')')
        ? ELEMENT_ALIAS.exec(rest.slice(closing.length))
        : undefined;
      const before = definition.slice(0, start);
      const call = before.lastIndexOf(ARRAY_ELEMENTS_CALL);
      const isOpensArrayElements =
        call !== -1 &&
        before
          .slice(call + ARRAY_ELEMENTS_CALL.length)
          .replaceAll('(', '')
          .trim() === '';

      if (operator === '->' && elements && isOpensArrayElements) {
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
