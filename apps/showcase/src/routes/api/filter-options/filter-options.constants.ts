/**
 * Tying them would let a change made for the dropdown's ergonomics silently change what a
 * public endpoint serves, and that coupling runs in the unsafe direction.
 * Nothing legitimate is clamped by it: the filter dropdown asks for
 * `DEFAULT_FILTER_PAGE_SIZE` a page at a time, so the ceiling is headroom rather than a
 * limit the client reaches.
 */
export const MAX_FILTER_OPTIONS_LIMIT = 1000;
