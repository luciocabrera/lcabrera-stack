import type { ShouldRevalidateFunctionArgs } from 'react-router';

import { isPersistCookieAction } from './isPersistCookieAction.util';

export const shouldRevalidatePersistCookieAction = ({
  actionStatus,
  defaultShouldRevalidate,
  formAction,
}: ShouldRevalidateFunctionArgs) => {
  return actionStatus === 204 && isPersistCookieAction(formAction)
    ? false
    : defaultShouldRevalidate;
};
