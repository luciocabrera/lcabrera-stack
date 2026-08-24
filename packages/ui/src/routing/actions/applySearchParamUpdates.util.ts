type ApplySearchParamUpdatesArgs = {
  readonly searchParams: URLSearchParams;
  readonly updates: readonly SearchParamUpdate[];
};

type SearchParamUpdate = {
  readonly key: string;
  readonly value: string;
};

export const applySearchParamUpdates = ({
  searchParams,
  updates,
}: ApplySearchParamUpdatesArgs) =>
  updates
    .filter(({ key }) => key !== '')
    .reduce(
      (acc, { key, value }) => {
        const current = acc.searchParams.get(key) || undefined;
        const next = value || undefined;
        const nextParams = new URLSearchParams(acc.searchParams);

        if (next === undefined) {
          nextParams.delete(key);
        } else {
          nextParams.set(key, next);
        }

        return {
          changed: acc.changed || current !== next,
          searchParams: nextParams,
        };
      },
      { changed: false, searchParams: new URLSearchParams(searchParams) },
    );
