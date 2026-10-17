import { HASH_LABELS, SCOPED_HASH_PREFIXES } from './report.constants.ts';

export const hashLabel = (key: string) => {
  const prefix = Object.values(SCOPED_HASH_PREFIXES).find((candidate) =>
    key.startsWith(candidate),
  );

  if (prefix === undefined) {
    return HASH_LABELS[key] ?? key;
  }

  const scope = key.slice(prefix.length);
  const name =
    prefix === SCOPED_HASH_PREFIXES.content
      ? scope.slice(scope.indexOf('/') + 1)
      : scope;

  return `\`${name}\` ${HASH_LABELS[prefix] ?? prefix}`;
};
