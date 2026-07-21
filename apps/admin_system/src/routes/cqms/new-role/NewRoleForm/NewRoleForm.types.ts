import type { FieldErrors } from '@lcabrera/ui/components/Form';
import type { PermissionRow } from '@repo/scan-ingestion/queries/getAllPermissions.util';

import type { NewRoleValues } from '../newRole.schema';

export type NewRoleFormProps = {
  readonly permissionsPromise: Promise<readonly PermissionRow[]>;
  readonly serverErrors?: FieldErrors<NewRoleValues>;
};
