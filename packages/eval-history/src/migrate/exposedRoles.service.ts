import type {
  EvalsRole,
  ExposedRole,
  MigrationClient,
} from './migrate.types.ts';

import { inSequence } from '../ingest/inSequence.service.ts';
import { ownerPrivilegeObjects } from './ownerPrivilegeObjects.service.ts';

type ExposedRolesArgs = {
  readonly client: MigrationClient;
  readonly roles: readonly EvalsRole[];
};

export const exposedRoles = async ({ client, roles }: ExposedRolesArgs) => {
  const checked: readonly ExposedRole[] = await inSequence({
    items: roles,
    step: async (role) => ({
      ...(await ownerPrivilegeObjects({ client, role: role.name })),
      role,
    }),
  });

  return checked.filter(
    ({ definerFunctions, definerViews }) =>
      definerFunctions.length > 0 || definerViews.length > 0,
  );
};
