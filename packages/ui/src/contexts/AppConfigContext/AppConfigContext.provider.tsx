import type { AppConfigProviderProps } from './AppConfigContext.types';

import { DEFAULT_LOGOUT_ROUTE } from './AppConfigContext.constants';
import { AppConfigContext } from './AppConfigContext.context';

/**
 * Publishes the configuration a consuming app supplies once, at mount, to the
 * whole shell. It carries a plain value rather than a store because none of it
 * changes for the lifetime of the app — there is nothing to subscribe to, and
 * the `TableWrapper` context is the same shape for the same reason.
 *
 * It exists so the navigation subtree stops being a pipe: the app's route links
 * and its session flag reach the delegate that renders them without every
 * component in between having to declare a prop it does not use.
 */
export const AppConfigProvider = ({
  children,
  getNavigationItems,
  isAuthEnabled = false,
  logoutRoute = DEFAULT_LOGOUT_ROUTE,
}: AppConfigProviderProps) => {
  const value = { getNavigationItems, isAuthEnabled, logoutRoute };

  return <AppConfigContext value={value}>{children}</AppConfigContext>;
};
