import { use } from 'react';

import { GlobalSettingsProvider } from '#ui/contexts/GlobalSettingsContext';
import { GlobalSettingsContext } from '#ui/contexts/GlobalSettingsContext/GlobalSettingsContext.context';
import { NotificationProvider } from '#ui/contexts/NotificationContext';
import { NotificationContext } from '#ui/contexts/NotificationContext/NotificationContext.context';

import type { TableOwnStackChromeProvidersProps } from './TableOwnStack.types';

import { FiltersDataProvider } from '../contexts/FiltersData';

export const TableOwnStackChromeProviders = <
  TData extends Record<string, unknown>,
>({
  children,
  columns,
}: TableOwnStackChromeProvidersProps<TData>) => {
  const hasGlobalSettings = use(GlobalSettingsContext) !== undefined;
  const hasNotifications = use(NotificationContext) !== undefined;
  const withFilters = (
    <FiltersDataProvider<TData> columns={[...columns]}>
      {children}
    </FiltersDataProvider>
  );
  const withSettings = hasGlobalSettings ? (
    withFilters
  ) : (
    <GlobalSettingsProvider>{withFilters}</GlobalSettingsProvider>
  );

  return hasNotifications ? (
    withSettings
  ) : (
    <NotificationProvider>{withSettings}</NotificationProvider>
  );
};
