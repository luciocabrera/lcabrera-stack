import { Links, Meta, Scripts, ScrollRestoration } from 'react-router';

import { DevStyleXInject } from '#ui/components/DevStyleXInject';

import type { AppDocumentProps } from './AppDocument.types';

export const AppDocument = ({
  children,
  rootData,
  stylexCssHref,
}: AppDocumentProps) => {
  const cspNonce = rootData?.cspNonce;

  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta content='width=device-width, initial-scale=1' name='viewport' />
        {Boolean(cspNonce) && <meta nonce={cspNonce} property='csp-nonce' />}
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
