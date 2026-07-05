import type { LayoutProps } from '@repo/ui/types/ui.types';

import { AppDocument } from '@repo/ui/components/AppDocument';
import { useRouteLoaderData } from 'react-router';

import type { loader as rootLoader } from './root.loader';

import stylexCssHref from '../stylex.css?url';

export const Layout = ({ children }: LayoutProps) => {
  const rootData = useRouteLoaderData<typeof rootLoader>('root');

  return (
    <AppDocument rootData={rootData} stylexCssHref={stylexCssHref}>
      {children}
    </AppDocument>
  );
};
