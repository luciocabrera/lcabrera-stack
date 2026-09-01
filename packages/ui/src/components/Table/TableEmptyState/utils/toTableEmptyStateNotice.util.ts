import type { TableResponseError } from '#ui/components/Table/Table.types';

type ToTableEmptyStateNoticeArgs = {
  readonly columnName: string | undefined;
  readonly error: TableResponseError | undefined;
  readonly titleSingular: string | undefined;
};

const DEFAULT_MESSAGE =
  'No records match the current view. Try adjusting your filters or refreshing the table.';

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
