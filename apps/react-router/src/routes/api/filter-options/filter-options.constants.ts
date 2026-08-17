/**
 * The largest page of distinct filter values this route will serve — the
 * dropdown-shaped sibling of `MAX_ENTERPRISE_ORDERS_LIMIT` and
 * `MAX_CAR_SALES_LIMIT`, and the same bound the demo API servers apply to their
 * own `/api/distinct`.
 *
 * `/_api/filter-options` is a public, unauthenticated URL, so without a ceiling
 * `?limit=999999999` reads every distinct value the column holds and serialises
 * all of them into one response (#736). A distinct read returns one column's
 * deduplicated values, so the response is smaller than a row read at the same
 * ceiling — which is why this is a real bound rather than an urgent one.
 *
 * Written out rather than derived from `DEFAULT_FILTER_PAGE_SIZE`, which is the
 * Table's **UI** paging decision. Tying them would let a change made for the
 * dropdown's ergonomics silently change what a public endpoint serves, and that
 * coupling runs in the unsafe direction.
 *
 * Nothing legitimate is clamped by it: the filter dropdown asks for
 * `DEFAULT_FILTER_PAGE_SIZE` a page at a time, so the ceiling is headroom rather
 * than a limit the client reaches.
 */
export const MAX_FILTER_OPTIONS_LIMIT = 1000;
