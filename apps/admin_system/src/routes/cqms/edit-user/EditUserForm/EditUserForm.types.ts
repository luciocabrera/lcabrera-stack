import type { RoleListViewRow } from '@repo/scan-ingestion/queries/getRoleListView.util';
import type { UserWithRoles } from '@repo/scan-ingestion/queries/getUserWithRoles.util';
import type { FieldErrors } from '@repo/ui/components/Form';

import type { EditUserValues } from '../editUser.schema';

export type EditUserFormProps = {
  readonly rolesPromise: Promise<readonly RoleListViewRow[]>;
  readonly serverErrors?: FieldErrors<EditUserValues>;
  readonly user: UserWithRoles;
};
