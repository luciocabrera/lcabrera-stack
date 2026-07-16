type ReadNewRoleFormValuesArgs = {
  readonly formData: FormData;
};

/**
 * The fields the create-role form posts, ready for newRoleSchema.
 *
 * Text fields fall back to '' so the schema reports a readable field error
 * rather than zod complaining about the wrong type.
 */
export const readNewRoleFormValues = ({
  formData,
}: ReadNewRoleFormValuesArgs) => ({
  description: formData.get('description') ?? '',
  permissionIds: formData.getAll('permissionIds'),
  roleName: formData.get('roleName') ?? '',
});
