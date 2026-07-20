import { isCheckboxChecked } from '@repo/utils/forms/is-checkbox-checked.util';

type ReadEditRoleFormValuesArgs = {
  readonly formData: FormData;
};

/**
 * The fields the edit-role form posts, ready for editRoleSchema. There is no
 * roleName: it is immutable (the natural key the lockout guards reference).
 *
 * An unchecked checkbox posts nothing at all, hence isCheckboxChecked rather
 * than a `.get()`.
 */
export const readEditRoleFormValues = ({
  formData,
}: ReadEditRoleFormValuesArgs) => ({
  description: formData.get('description') ?? '',
  isEnabled: isCheckboxChecked({ formData, name: 'isEnabled' }),
  permissionIds: formData.getAll('permissionIds'),
});
