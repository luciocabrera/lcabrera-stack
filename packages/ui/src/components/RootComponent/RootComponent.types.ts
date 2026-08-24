import type { GetNavigationItems } from '#ui/contexts/AppConfigContext/AppConfigContext.types';
import type { ThemeMode } from '#ui/types/theme.types';

export type RootComponentProps = {
  readonly appId?: string;
  readonly defaultTheme?: ThemeMode;
  readonly getNavigationItems: GetNavigationItems;
  readonly isAuthEnabled?: boolean;
  readonly logoutRoute?: string;
};
