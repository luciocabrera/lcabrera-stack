import type { ShouldRevalidateFunctionArgs } from 'react-router';

import { PERSIST_COOKIE_ACTION } from '@/constants/globalSettings.constants';

const isPersistCookieAction = (formAction: null | string) => {
  if (!formAction) {
    return false;
  }

  return (
    formAction === PERSIST_COOKIE_ACTION ||
    formAction.endsWith(PERSIST_COOKIE_ACTION)
  );
};

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
  if (actionStatus === 204 && isPersistCookieAction(formAction ?? null)) {
    return false;
  }

  return defaultShouldRevalidate;
};
