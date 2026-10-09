export const issueField = (path: readonly PropertyKey[]) =>
  path.length === 0 ? '(root)' : path.map(String).join('.');
