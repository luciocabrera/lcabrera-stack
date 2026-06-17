import {
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from 'react-router';

import type { LayoutProps } from '@/types/ui.types';

import { DevStyleXInject } from '@/components/DevStyleXInject';

import type { loader as rootLoader } from './root.loader';

import stylexCssHref from '../stylex.css?url';

export const Layout = ({ children }: LayoutProps) => {
  const rootData = useRouteLoaderData<typeof rootLoader>('root');
  const cspNonce = rootData?.cspNonce;

  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta content='width=device-width, initial-scale=1' name='viewport' />
        {cspNonce ? <meta nonce={cspNonce} property='csp-nonce' /> : undefined}
        <Meta />
        <DevStyleXInject cssHref={stylexCssHref} />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration nonce={cspNonce} />
        <Scripts nonce={cspNonce} />
      </body>
    </html>
  );
};
