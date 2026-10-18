import { plainIdentifier } from './plainIdentifier.util.ts';
import {
  ALLOWED_WHOLE_JSONB,
  PUBLIC_FIELD_PATHS,
  PUBLIC_JSONB_COLUMNS,
} from './queries.constants.ts';

type FieldSourceArgs = {
  readonly column: string;
  readonly field: string;
  readonly qualified: string;
};

type ProjectedRelationArgs = {
  readonly columns: readonly string[];
  readonly publicColumns: ReadonlySet<string>;
  readonly table: string;
};

const fieldSource = ({ column, field, qualified }: FieldSourceArgs) => {
  const wholeJsonb: readonly string[] = ALLOWED_WHOLE_JSONB;

  if (wholeJsonb.includes(qualified)) {
    return column;
  }

  const fieldPaths: readonly string[] = PUBLIC_FIELD_PATHS;
  const publicCopies = new Map<string, string>(
    Object.entries(PUBLIC_JSONB_COLUMNS),
  );
  const copy = publicCopies.get(qualified);

  if (copy === undefined || !fieldPaths.includes(`${qualified}.${field}`)) {
    throw new Error(`${qualified}.${field} is not on the public allow-list`);
  }

  return copy;
};

export const projectedRelation = ({
  columns,
  publicColumns,
  table,
}: ProjectedRelationArgs) => {
  const wholeJsonb: readonly string[] = ALLOWED_WHOLE_JSONB;
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

    return `${fieldSource({ column, field, qualified })} -> '${plainIdentifier(field)}' as ${column}_${field}`;
  });

  return `(select ${select.join(', ')} from evals.${table})`;
};
