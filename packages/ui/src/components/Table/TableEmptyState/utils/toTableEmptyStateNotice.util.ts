import type { TableResponseError } from '#ui/components/Table/Table.types';

type ToTableEmptyStateNoticeArgs = {
  readonly columnName: string | undefined;
  readonly error: TableResponseError | undefined;
  readonly titleSingular: string | undefined;
};

const DEFAULT_MESSAGE =
  'No records match the current view. Try adjusting your filters or refreshing the table.';

/**
 * **The sentence is the endpoint's, the heading is the table's.** Only the endpoint knows
 * why it refused — the catalogue rule, the estimated row count, the threshold — and it has
 * already vetted that text for anything a client may not see.
 * Rewriting the former here would drop the reason; omitting the latter leaves the user
 * with a column name they have never seen on screen.
 */
export const toTableEmptyStateNotice = ({
  columnName,
  error,
  titleSingular,
}: ToTableEmptyStateNoticeArgs) => {
  if (error === undefined)
    return { message: DEFAULT_MESSAGE, title: titleSingular };

  if (error.kind === 'grouping-refused')
    return {
      message: error.message,
      title:
        columnName === undefined || error.reason !== 'column-not-groupable'
          ? 'This grouping was refused'
          : `Grouping by ${columnName} was refused`,
    };

  if (error.kind === 'db-canceled')
    return { message: error.message, title: 'This query took too long' };

  return { message: error.message, title: 'This table could not be loaded' };
};
