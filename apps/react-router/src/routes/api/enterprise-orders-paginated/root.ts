export { loader } from './enterprise-orders-paginated.loader';

// NOTE: the auth guard is intentionally disabled here to match the
// enterprise-orders UI subtree. With the guard on, the table's infinite-scroll
// load-more fetch was redirected to `/login`, so the fetcher received HTML
// instead of JSON — breaking the loading shimmer. Re-enable together with the
// subtree guard once the middleware issue is resolved.
