import { readFromCookie } from "@/utils/storage";

import type { PersistedState } from "./persistence.types.ts";

import { getStorageKey } from "./getStorageKey.util.ts";
import { PERSISTENCE_VERSION } from "./persistence.constants.ts";

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
}: ReadPersistedStateFromCookieArgs): Partial<PersistedState> => {
  const result: { -readonly [K in keyof PersistedState]?: PersistedState[K] } = {};
  const storageKey = getStorageKey({ persistenceKey });

  const slices: (keyof Omit<PersistedState, "version">)[] = [
    "sorting",
    "columnFilters",
    "columnOrder",
    "columnPinning",
    "columnSizing",
    "columnVisibility",
  ];

  for (const slice of slices) {
    const sliceKey = `${storageKey}-${slice}`;
    const rawValue = readFromCookie({ cookieString, key: sliceKey });

    if (rawValue) {
      try {
        const parsed = JSON.parse(decodeURIComponent(rawValue)) as {
          value: unknown;
          version: number;
        };
        if (parsed.version === PERSISTENCE_VERSION) {
          // Convert array to Set for columnVisibility
          result[slice] = (
            slice === "columnVisibility" && Array.isArray(parsed.value)
              ? new Set(parsed.value as string[])
              : parsed.value
          ) as never;
        }
      } catch {
        // Invalid JSON, skip
      }
    }
  }

  return result as Partial<PersistedState>;
};
