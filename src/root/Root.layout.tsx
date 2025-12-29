import { Links, Meta, Scripts, ScrollRestoration } from 'react-router';

import type { LayoutProps } from '@/types/ui.types';

import { DevStyleXInject } from '@/components/DevStyleXInject';

import stylexCssHref from '../stylex.css?url';

export const Layout = ({ children }: LayoutProps) => {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta content='width=device-width, initial-scale=1' name='viewport' />
        <Meta />
        <DevStyleXInject cssHref={stylexCssHref} />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};
