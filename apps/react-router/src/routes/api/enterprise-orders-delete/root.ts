import { authMiddleware } from '@/auth/authMiddleware';

export { action } from './enterprise-orders-delete.action';

/**
 * Guards the delete resource route: an unauthenticated POST is redirected to
 * `/login` before the action runs, matching the guard on the enterprise-orders
 * UI subtree so the mutation endpoint can't be driven without a session.
 */
export const middleware = [authMiddleware];
