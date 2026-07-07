import type { PermissionRow } from '@repo/scan-ingestion/queries/getAllPermissions.util';
import type { RoleWithPermissions } from '@repo/scan-ingestion/queries/getRoleWithPermissions.util';
import type { FieldErrors } from '@repo/ui/components/Form';

import type { EditRoleValues } from '../editRole.schema';

export type EditRoleFormProps = {
  readonly permissionsPromise: Promise<readonly PermissionRow[]>;
  readonly role: RoleWithPermissions;
  readonly serverErrors?: FieldErrors<EditRoleValues>;
};
