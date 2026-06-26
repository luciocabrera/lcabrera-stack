import type { ShouldRevalidateFunctionArgs } from 'react-router';

import { isPersistCookieAction } from './isPersistCookieAction.util';

/**
 * Prevents loader revalidation for cookie-only persistence responses.
 *
 * React Router revalidates after action submissions by default.
 * For `/_action/persist-cookie`, a `204` status means there was no effective
 * search-param change, so data loaders should not be re-run.
 */
export const shouldRevalidatePersistCookieAction = ({
  actionStatus,
  defaultShouldRevalidate,
  formAction,
}: ShouldRevalidateFunctionArgs) => {
  if (actionStatus === 204 && isPersistCookieAction(formAction)) {
    return false;
  }

  return defaultShouldRevalidate;
};
