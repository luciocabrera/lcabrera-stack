import { PERSIST_COOKIE_ACTION } from '@lcabrera/ui/constants/globalSettings.constants';

/**
 * Returns true when the given form action targets the persist-cookie endpoint,
 * either as an exact path or as an absolute URL ending with the path.
 */
export const isPersistCookieAction = (
  formAction: null | string | undefined,
) => {
  if (!formAction) {
    return false;
  }

  return (
    formAction === PERSIST_COOKIE_ACTION ||
    formAction.endsWith(PERSIST_COOKIE_ACTION)
  );
};
