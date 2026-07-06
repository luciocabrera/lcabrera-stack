import type { LoaderFunctionArgs } from 'react-router';

import { loader as browseDirectoryLoader } from '@repo/ui/routing/browseDirectory.loader';

import { requireUser } from '@/auth/requireUser.util';

/**
 * The shared browseDirectory loader lists real directories on this
 * machine, so it is gated like the cqms pages that use it (ADR-017) —
 * no longer a bare re-export.
 */
export const loader = async (args: LoaderFunctionArgs) => {
  await requireUser({ request: args.request });
  return browseDirectoryLoader(args);
};
