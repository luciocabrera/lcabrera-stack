import type { TableResponseError } from '#ui/components/Table/Table.types';

type ToTableEmptyStateNoticeArgs = {
  /**
   * The column the refusal names, as the user knows it — its header label,
   * falling back to the raw key when the table declares no column by that name.
   * `undefined` when the refusal names none.
   *
   * Supplied whatever role that column plays; **this function decides whether
   * the role permits naming it in the heading** (see below), so the caller does
   * not have to know the refusal vocabulary.
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
 * **Only `column-not-groupable` may name the column in the heading**, because it
 * is the one refusal whose column *is* the group key that was refused. The
 * others name a column in a different role and "Grouping by X was refused"
 * would be a false sentence about each: `estimate-too-large` names the
 * **widest** key, which is the one worth dropping and usually not the one just
 * picked, so a user who added a fourth column would be told the first was
 * refused; `aggregate-not-legal` names an *aggregated* column, which may not be
 * a group key at all; and `unknown-column` is raised for a key and for an
 * aggregated column alike, so it cannot be told apart here. Each of those keeps
 * the neutral heading and lets the endpoint's sentence carry the column with
 * its correct role — which every one of those messages already does.
 *
 * Only the grouping arm is a *dead end for retrying*: re-running the loader
 * sends the same keys and is refused again, which is why the caller pairs that
 * arm alone with an action that changes the request. A cancelled or failed read
 * can genuinely succeed on a second attempt, and keeps the Retry offer.
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
