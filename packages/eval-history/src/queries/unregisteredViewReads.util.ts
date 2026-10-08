import { jsonbFieldReads } from './jsonbFieldReads.util.ts';

type UnregisteredViewReadsArgs = {
  readonly definitions: ReadonlyMap<string, string>;
  readonly fieldPaths: readonly string[];
  readonly guarded: readonly string[];
  readonly jsonbColumns: readonly string[];
  readonly usage: readonly ViewColumn[];
};

type ViewColumn = {
  readonly column: string;
  readonly view: string;
};

export const unregisteredViewReads = ({
  definitions,
  fieldPaths,
  guarded,
  jsonbColumns,
  usage,
}: UnregisteredViewReadsArgs) =>
  usage
    .filter(({ column }) => guarded.includes(column))
    .flatMap(({ column, view }) => {
      if (!jsonbColumns.includes(column)) {
        return [`${view}: ${column}`];
      }

      const reads = jsonbFieldReads({
        column,
        definition: definitions.get(view) ?? '',
      });

      return reads.length === 0
        ? [`${view}: ${column}`]
        : reads
            .filter((read) => !fieldPaths.includes(read))
            .map((read) => `${view}: ${read}`);
    });
