import type { ShouldRevalidateFunctionArgs } from 'react-router';

import { isPersistCookieAction } from './isPersistCookieAction.util';

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
