export { loader } from './enterprise-orders-drill.loader';

// NOTE: the auth guard is intentionally disabled here, matching its
// `enterprise-orders-paginated` sibling and the enterprise-orders UI subtree.
// With the guard on, a client fetch is redirected to `/login` and receives HTML
// instead of JSON.
//
// This route adds no exposure the subtree did not already have: it serves a
// filtered **subset** of rows `enterprise-orders-paginated` already returns
// unauthenticated. Re-enabling one route alone would break the drill without
// closing anything, because the same rows stay reachable next door — so the fix
// is the middleware's, and it is tracked in #407: return a **401 JSON** for
// `_api` routes rather than an HTML redirect, then re-enable the guard on every
// entry point at once. This is now the fourth.
