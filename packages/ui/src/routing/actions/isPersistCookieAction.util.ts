import { PERSIST_COOKIE_ACTION } from '#ui/constants/globalSettings.constants';

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
