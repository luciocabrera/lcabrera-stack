import { createCookieSessionStorage } from 'react-router';

import { readSessionEnvConfig } from './env.schema';

type SessionData = {
  readonly userId: string;
};

/**
 * Module-level initialization is safe here: this file is only ever
 * imported from loaders/actions (server-side, tree-shaken out of the
 * client bundle), and readSessionEnvConfig never throws thanks to the
 * schema's dev default. Cookie is httpOnly + sameSite=lax; no maxAge
 * means a session cookie that ends with the browser session.
 */
const authSessionStorage = createCookieSessionStorage<SessionData>({
  cookie: {
    httpOnly: true,
    name: '__cqms_session',
    path: '/',
    sameSite: 'lax',
    secrets: [readSessionEnvConfig({ env: process.env }).SESSION_SECRET],
  },
});

export const getSessionStorage = (): typeof authSessionStorage =>
  authSessionStorage;
