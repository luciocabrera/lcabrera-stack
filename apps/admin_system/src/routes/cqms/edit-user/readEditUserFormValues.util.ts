import { isCheckboxChecked } from '@repo/utils/forms/is-checkbox-checked.util';

type ReadEditUserFormValuesArgs = {
  readonly formData: FormData;
};

/**
 * The fields the edit-user form posts, ready for editUserSchema. There is no
 * username: it is immutable (the natural key admin routes are keyed by).
 *
 * `newPassword` falls back to '' — the schema reads empty as "keep the current
 * password", so an absent field and a blank one must mean the same thing.
 */
export const readEditUserFormValues = ({
  formData,
}: ReadEditUserFormValuesArgs) => ({
  displayName: formData.get('displayName') ?? '',
  isEnabled: isCheckboxChecked({ formData, name: 'isEnabled' }),
  newPassword: formData.get('newPassword') ?? '',
  roleIds: formData.getAll('roleIds'),
});
