import { getUserById } from '@repo/scan-ingestion/queries/getUserById.util';
import { type LoaderFunctionArgs, redirect } from 'react-router';

import { getSessionStorage } from '@/auth/getSessionStorage.util';

/**
 * An already-authenticated user visiting /login is bounced straight to
 * the app — mirrors requireUser's check without its redirect-to-login
 * throw (this IS the login page).
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { getSession } = getSessionStorage();
  const session = await getSession(request.headers.get('Cookie'));
  const userId = session.get('userId');

  if (userId !== undefined) {
    const user = await getUserById({ userId });
    if (user !== undefined) {
      throw redirect('/cqms/projects');
    }
  }

  return {};
};
