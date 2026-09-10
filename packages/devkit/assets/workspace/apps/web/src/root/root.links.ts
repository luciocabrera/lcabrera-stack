import type { LinksFunction } from 'react-router';

import appCssHref from '../index.css?url';

export const links: LinksFunction = () => [
  { href: appCssHref, rel: 'stylesheet' },
];
