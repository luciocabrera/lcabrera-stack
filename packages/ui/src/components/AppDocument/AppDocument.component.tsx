import { DevStyleXInject } from '@lcabrera/ui/components/DevStyleXInject';
import { Links, Meta, Scripts, ScrollRestoration } from 'react-router';

import type { AppDocumentProps } from './AppDocument.types';

/**
 * The `<html>` document shell shared by every route's `Layout` export —
 * head boilerplate (charset/viewport/CSP nonce meta, <Meta>, StyleX dev
 * injection, <Links>) and body wiring (<ScrollRestoration>/<Scripts>).
 * The app-specific pieces (the loader call for rootData, the app's own
 * compiled stylexCssHref import) stay in the app's own Root.layout.tsx —
 * this component only takes their resolved values as props.
 */
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
