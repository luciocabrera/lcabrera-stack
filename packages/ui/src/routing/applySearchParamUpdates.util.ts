export type SearchParamUpdate = {
  readonly key: string;
  readonly value: string;
};

type ApplySearchParamUpdatesArgs = {
  readonly searchParams: URLSearchParams;
  readonly updates: readonly SearchParamUpdate[];
};

/**
 * Apply a list of search-param updates to a starting `URLSearchParams` without
 * mutating it. An empty `value` deletes the param; a non-empty `value` sets it.
 * Updates with an empty `key` are ignored. Returns the next `URLSearchParams`
 * (a fresh object) plus whether any update effectively changed the query —
 * empty string and absent both normalize to `undefined`, so re-applying the
 * current value reports no change.
 */
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
