/**
 * Removes any trailing `/` from a value so a base URL can be joined with a
 * path without producing a double slash.
 *
 * Written as an index scan rather than the obvious `value.replace(/\/+$/, '')`.
 * That pattern is quadratic: for a value ending in a long run of slashes
 * followed by anything else, the engine retries the greedy `\/+` from every
 * position and backtracks the whole run each time. This walks the end of the
 * string once.
 *
 * The scan works in UTF-16 units, matching what `slice` expects. Counting
 * code points instead (`[...value]`) would desynchronise the index from
 * `slice` for any value containing an astral character earlier in the string.
 */
export const stripTrailingSlashes = (value: string) => {
  let end = value.length;
  while (end > 0 && value.charAt(end - 1) === '/') {
    end -= 1;
  }

  return value.slice(0, end);
};
