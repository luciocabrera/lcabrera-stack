type ParseGrantPermissionArgs = {
  readonly permission: string;
};

/**
 * Splits a curated `'action:resourceType'` grant option (see GRANT_OPTIONS)
 * into the two arguments createResourceGrant takes.
 *
 * The schema's regex has already proven the shape, so this never fails; the
 * empty-string fallbacks exist only because a destructured split is
 * `string | undefined` to TypeScript, and an empty action or resourceType
 * would be rejected by the DB function anyway.
 */
export const parseGrantPermission = ({
  permission,
}: ParseGrantPermissionArgs) => {
  const [action, resourceType] = permission.split(':', 2);

  return { action: action ?? '', resourceType: resourceType ?? '' };
};
