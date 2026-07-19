import { authMiddleware } from '@/auth/authMiddleware';

export { ErrorBoundary } from './enterprise-orders.errorBoundary';
export { EnterpriseOrdersLayout as default } from './enterprise-orders.layout';
export { loader } from './enterprise-orders.loader';
export { meta } from './enterprise-orders.meta';
export { shouldRevalidatePersistCookieAction as shouldRevalidate } from '@repo/ui/routing/shouldRevalidatePersistCookieAction.util';

/**
 * Guards the whole enterprise-orders subtree: unauthenticated requests are
 * redirected to `/login?redirectTo=<url>`; on success the verified claims are
 * published on `authContext` for the loaders/actions below to read.
 */
export const middleware = [authMiddleware];
