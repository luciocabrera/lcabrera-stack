export { loader } from './enterprise-orders-drill.loader';

// NOTE: the auth guard is intentionally disabled here, matching its
// `enterprise-orders-paginated` sibling and the enterprise-orders UI subtree.
// With the guard on, a client fetch is redirected to `/login` and receives HTML
// instead of JSON. Re-enable together with the subtree guard once the
// middleware issue is resolved.
