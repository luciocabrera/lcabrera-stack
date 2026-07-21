export { loader } from './enterprise-orders.loader';
export { meta } from './enterprise-orders.meta';
export { ErrorBoundary } from './EnterpriseOrders.error-boundary';
export { EnterpriseOrdersLayout as default } from './EnterpriseOrders.layout';
export { shouldRevalidatePersistCookieAction as shouldRevalidate } from '@lcabrera/ui/routing/shouldRevalidatePersistCookieAction.util';

// NOTE: the auth guard (`export const middleware = [authMiddleware]`) is
// intentionally disabled for now — it broke client-side navigation into the
// subtree. Re-enable it here (and on the paginated/delete resource routes)
// once the middleware issue is resolved.
