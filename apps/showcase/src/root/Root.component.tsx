import { RootComponent } from '@lcabrera/ui';
import { useRouteLoaderData } from 'react-router';

import { LOGOUT_ROUTE } from '@/auth/auth.constants';
import { APP_ID } from '@/constants/app.constants';

import type { loader } from './root.loader';

import { getNavigationItems } from './getNavigationItems.util';

export const Root = () => {
  const isEvalsDashboardEnabled =
    useRouteLoaderData<typeof loader>('root')?.isEvalsDashboardEnabled === true;

  return (
    <RootComponent
      appId={APP_ID}
      defaultTheme='light'
      getNavigationItems={(iconSize) =>
        getNavigationItems({ iconSize, isEvalsDashboardEnabled })
      }
      isAuthEnabled
      logoutRoute={LOGOUT_ROUTE}
    />
  );
};
