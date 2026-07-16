import type { RoleListViewRow } from '@repo/scan-ingestion/queries/getRoleListView.util';
import type { FieldErrors } from '@repo/ui/components/Form';

import type { NewUserValues } from '../newUser.schema';

export type NewUserFormProps = {
  readonly rolesPromise: Promise<readonly RoleListViewRow[]>;
  readonly serverErrors?: FieldErrors<NewUserValues>;
};
