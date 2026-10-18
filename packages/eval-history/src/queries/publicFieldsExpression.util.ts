import { compareCodeUnits } from '../hashing/compareCodeUnits.util.ts';
import { plainIdentifier } from './plainIdentifier.util.ts';
import { PUBLIC_FIELD_PATHS } from './queries.constants.ts';

const NESTED_FIELD = /[.[]/;

export const publicFieldsExpression = (source: string) => {
  const [, column = ''] = source.split('.', 2);
  const pairs = PUBLIC_FIELD_PATHS.filter((path) =>
    path.startsWith(`${source}.`),
  )
    .map((path) => path.slice(source.length + 1))
    .filter((field) => !NESTED_FIELD.test(field))
    .toSorted(compareCodeUnits)
    .map(
      (field) =>
        `'${plainIdentifier(field)}': ${plainIdentifier(column)} -> '${field}'`,
    );

  return `json_object(${pairs.join(', ')} absent on null returning jsonb)`;
};
