import type { Route } from '../+types/root';

import appCssHref from '../app.css?url';

export const links: Route.LinksFunction = () => [
  { href: '/favicon.ico', rel: 'icon' },
  { href: appCssHref, rel: 'stylesheet' },
];
