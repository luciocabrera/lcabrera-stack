import type { Route } from '../+types/root';

import appCssHref from '../index.css?url';

export const links: Route.LinksFunction = () => [
  { href: '/favicon.ico', rel: 'icon' },
  { href: appCssHref, rel: 'stylesheet' },
];
