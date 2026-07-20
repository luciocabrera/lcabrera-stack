import { authMiddleware } from '@/auth/authMiddleware';

export { loader } from './enterprise-orders-paginated.loader';

/**
 * Guards the paginated load-more resource route: an unauthenticated fetch is
 * redirected to `/login` before the loader runs, matching the guard on the
 * enterprise-orders UI subtree so order data can't be read without a session.
 */
export const middleware = [authMiddleware];
