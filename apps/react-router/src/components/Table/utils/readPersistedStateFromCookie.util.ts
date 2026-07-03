import { readFromCookie } from '@/utils/storage';

import type { PersistedState } from './persistence.types';

import { collectPersistedStateSlices } from './collectPersistedStateSlices.util';

type ReadPersistedStateFromCookieArgs = {
  readonly cookieString?: string;
  readonly persistenceKey: string;
};

/**
 * Read persisted state from cookies synchronously (SSR-safe)
 *
 * This function can be called during SSR to initialize table state
 * from cookies sent with the request.
 *
 * @example
 * ```tsx
 * // In browser
 * const state = readPersistedStateFromCookie({ persistenceKey: 'my-table' });
 *
 * // In SSR (React Router loader)
 * export async function loader({ request }) {
 *   const cookieHeader = request.headers.get('Cookie');
 *   const state = readPersistedStateFromCookie({
 *     persistenceKey: 'my-table',
 *     cookieString: cookieHeader
 *   });
 *   return { initialTableState: state };
 * }
 * ```
 */
export const readPersistedStateFromCookie = ({
  cookieString,
  persistenceKey,
}: ReadPersistedStateFromCookieArgs): Partial<PersistedState> =>
  collectPersistedStateSlices({
    persistenceKey,
    readRawSlice: (sliceKey) => readFromCookie({ cookieString, key: sliceKey }),
    transformRaw: decodeURIComponent,
  });
