import { RootComponent } from '@lcabrera/ui';

import { APP_ID } from '@/constants/app.constants';

import { getNavigationItems } from './getNavigationItems.util';

export const Root = () => (
  <RootComponent
    appId={APP_ID}
    defaultTheme='light'
    getNavigationItems={getNavigationItems}
  />
);
