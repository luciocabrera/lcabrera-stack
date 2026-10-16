import { plainIdentifier } from './plainIdentifier.util.ts';
import {
  ALLOWED_WHOLE_JSONB,
  PUBLIC_FIELD_PATHS,
} from './queries.constants.ts';

type ProjectedRelationArgs = {
  readonly columns: readonly string[];
  readonly publicColumns: ReadonlySet<string>;
  readonly table: string;
};

export const projectedRelation = ({
  columns,
  publicColumns,
  table,
}: ProjectedRelationArgs) => {
  const wholeJsonb: readonly string[] = ALLOWED_WHOLE_JSONB;
  const fieldPaths: readonly string[] = PUBLIC_FIELD_PATHS;
  const select = columns.map((entry) => {
    const [column = '', field, ...deeper] = entry.split('.');
    const qualified = `${plainIdentifier(table)}.${plainIdentifier(column)}`;

    if (deeper.length > 0) {
      throw new Error(`${table}.${entry} reaches below a top-level field`);
    }

    if (field === undefined) {
      if (!publicColumns.has(qualified) && !wholeJsonb.includes(qualified)) {
        throw new Error(`${qualified} is not on the public allow-list`);
      }

      return column;
    }

    if (
      !fieldPaths.includes(`${qualified}.${field}`) &&
      !wholeJsonb.includes(qualified)
    ) {
      throw new Error(`${qualified}.${field} is not on the public allow-list`);
    }

    return `${column} -> '${plainIdentifier(field)}' as ${column}_${field}`;
  });

  return `(select ${select.join(', ')} from evals.${table})`;
};
