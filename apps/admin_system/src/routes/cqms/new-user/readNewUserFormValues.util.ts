type ReadNewUserFormValuesArgs = {
  readonly formData: FormData;
};

/**
 * The fields the create-user form posts, ready for newUserSchema.
 *
 * Every text field falls back to '' so the schema reports a readable field
 * error instead of zod complaining about the wrong type — `.get()` returns
 * null for a field the form never sent.
 */
export const readNewUserFormValues = ({
  formData,
}: ReadNewUserFormValuesArgs) => ({
  displayName: formData.get('displayName') ?? '',
  password: formData.get('password') ?? '',
  roleIds: formData.getAll('roleIds'),
  username: formData.get('username') ?? '',
});
