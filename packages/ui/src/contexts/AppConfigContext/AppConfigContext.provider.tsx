import type { AppConfigProviderProps } from './AppConfigContext.types';

import { DEFAULT_LOGOUT_ROUTE } from './AppConfigContext.constants';
import { AppConfigContext } from './AppConfigContext.context';

export const AppConfigProvider = ({
  children,
  getNavigationItems,
  isAuthEnabled = false,
  logoutRoute = DEFAULT_LOGOUT_ROUTE,
}: AppConfigProviderProps) => {
  const value = { getNavigationItems, isAuthEnabled, logoutRoute };

  return <AppConfigContext value={value}>{children}</AppConfigContext>;
};
