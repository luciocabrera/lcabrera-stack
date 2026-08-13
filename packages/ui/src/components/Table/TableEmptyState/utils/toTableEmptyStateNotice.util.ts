import type { TableResponseError } from '#ui/components/Table/Table.types';

type ToTableEmptyStateNoticeArgs = {
  /**
   * The refused column as the user knows it — its header label, falling back to
   * the raw key when the table declares no column by that name. `undefined` when
   * the refusal is about the request as a whole rather than one column.
   */
  readonly columnName: string | undefined;
  readonly error: TableResponseError | undefined;
  /** The table's singular title; absent until the meta store carries one. */
  readonly titleSingular: string | undefined;
};

const DEFAULT_MESSAGE =
  'No records match the current view. Try adjusting your filters or refreshing the table.';

/**
 * What the empty table body says: the table's own title and a nudge about
 * filters when the query simply matched nothing, and the endpoint's refusal
 * when it declined to run the query at all.
 *
 * **The sentence is the endpoint's, the heading is the table's.** Only the
 * endpoint knows why it refused — the catalogue rule, the estimated row count,
 * the threshold — and it has already vetted that text for anything a client may
 * not see. Only the table knows what the user calls the column, which is a
 * header label and not the `snake_case` key the refusal names. Rewriting the
 * former here would drop the reason; omitting the latter leaves the user with a
 * column name they have never seen on screen.
 *
 * Every arm is a *dead end for retrying*: re-running the same loader produces
 * the same refusal, which is why the caller pairs this with an action that
 * changes the request rather than repeats it.
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
        columnName === undefined
          ? 'This grouping was refused'
          : `Grouping by ${columnName} was refused`,
    };

  if (error.kind === 'db-canceled')
    return { message: error.message, title: 'This query took too long' };

  return { message: error.message, title: 'This table could not be loaded' };
};
