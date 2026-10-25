/**
 * The subset of `semver.satisfies` the `.pnpmfile.cjs` hook needs, with no
 * dependency, because pnpm loads the hook before anything is installed
 * (ADR-139). `semver-range.test.mjs`, beside it, checks it against `semver`.
 *
 * Usage: required by `scripts/lib/eslint-typescript.cjs`. It runs no command;
 * it throws on a version or range it cannot read.
 */

const IDENTIFIER = '[0-9A-Za-z-]+';
const PART = String.raw`0|[1-9]\d*`;
const X_PART = String.raw`0|[1-9]\d*|[xX*]`;
const PRERELEASE = String.raw`(?:-(${IDENTIFIER}(?:\.${IDENTIFIER})*))?`;
const BUILD = String.raw`(?:\+${IDENTIFIER}(?:\.${IDENTIFIER})*)?`;

const FULL = new RegExp(
  String.raw`^v?(${PART})\.(${PART})\.(${PART})${PRERELEASE}${BUILD}$`,
);
const PARTIAL = new RegExp(
  String.raw`^v?(${X_PART})(?:\.(${X_PART})(?:\.(${X_PART})${PRERELEASE}${BUILD})?)?$`,
);

const OPERATORS = ['>=', '<=', '>', '<', '='];

const unreadable = (what, text) =>
  new Error(`semver-range: cannot read the ${what} "${text}"`);

const splitPrerelease = (text) => (text === undefined ? [] : text.split('.'));

const parseVersion = (text) => {
  const match = FULL.exec(text);
  if (match === null) {
    throw unreadable('version', text);
  }
  const [, major, minor, patch, prerelease] = match;
  return {
    prerelease: splitPrerelease(prerelease),
    tuple: [Number(major), Number(minor), Number(patch)],
  };
};

const isWildcard = (part) =>
  part === undefined || part === 'x' || part === 'X' || part === '*';

const parsePartial = (text) => {
  const match = PARTIAL.exec(text);
  if (match === null) {
    throw unreadable('range part', text);
  }
  const [, major, minor, patch, prerelease] = match;
  const parts = [major, minor, patch];
  const firstWild = parts.findIndex(isWildcard);
  const known = firstWild === -1 ? 3 : firstWild;
  if (parts.slice(known).some((part) => !isWildcard(part))) {
    throw unreadable('range part', text);
  }
  return {
    known,
    prerelease: known === 3 ? splitPrerelease(prerelease) : [],
    tuple: parts.map((part, index) => (index < known ? Number(part) : 0)),
  };
};

const compareIdentifiers = (left, right) => {
  const leftNumeric = /^\d+$/.test(left);
  const rightNumeric = /^\d+$/.test(right);
  if (leftNumeric && rightNumeric) {
    return Number(left) - Number(right);
  }
  if (leftNumeric !== rightNumeric) {
    return leftNumeric ? -1 : 1;
  }
  if (left === right) {
    return 0;
  }
  return left < right ? -1 : 1;
};

const comparePrerelease = (left, right) => {
  if (left.length === 0 || right.length === 0) {
    return right.length - left.length;
  }
  const index = left.findIndex(
    (identifier, at) =>
      at >= right.length || compareIdentifiers(identifier, right[at]) !== 0,
  );
  if (index === -1) {
    return left.length - right.length;
  }
  return index >= right.length
    ? 1
    : compareIdentifiers(left[index], right[index]);
};

const compare = (left, right) => {
  const index = [0, 1, 2].find((at) => left.tuple[at] !== right.tuple[at]);
  return index === undefined
    ? comparePrerelease(left.prerelease, right.prerelease)
    : left.tuple[index] - right.tuple[index];
};

const version = (tuple, prerelease = []) => ({ prerelease, tuple });

const bump = ({ tuple }, at) =>
  version(
    tuple.map((part, index) => {
      if (index < at) return part;
      return index === at ? part + 1 : 0;
    }),
    ['0'],
  );

const caretBumpIndex = ({ known, tuple }) => {
  if (tuple[0] !== 0 || known === 1) return 0;
  if (tuple[1] !== 0 || known === 2) return 1;
  return 2;
};

const NOTHING = [{ operator: '<', version: version([0, 0, 0], ['0']) }];

const expandWildcardMajor = (operator) =>
  operator === '<' || operator === '>' ? NOTHING : [];

const expand = (operator, text) => {
  const partial = parsePartial(text);
  if (partial.known === 0) {
    return expandWildcardMajor(operator);
  }
  const lower = version(partial.tuple, partial.prerelease);
  const full = partial.known === 3;
  const above = full ? undefined : bump(partial, partial.known - 1);
  switch (operator) {
    case '>':
      return full
        ? [{ operator, version: lower }]
        : [{ operator: '>=', version: version(above.tuple) }];
    case '>=':
      return [{ operator, version: lower }];
    case '<':
      return [
        { operator, version: full ? lower : version(partial.tuple, ['0']) },
      ];
    case '<=':
      return full
        ? [{ operator, version: lower }]
        : [{ operator: '<', version: above }];
    case '~':
      return [
        { operator: '>=', version: lower },
        {
          operator: '<',
          version: bump(partial, Math.min(partial.known - 1, 1)),
        },
      ];
    case '^':
      return [
        { operator: '>=', version: lower },
        { operator: '<', version: bump(partial, caretBumpIndex(partial)) },
      ];
    default:
      return full
        ? [{ operator: '=', version: lower }]
        : [
            { operator: '>=', version: lower },
            { operator: '<', version: above },
          ];
  }
};

const splitOperator = (token) => {
  const caretOrTilde = ['^', '~'].find((prefix) => token.startsWith(prefix));
  if (caretOrTilde !== undefined) {
    return [caretOrTilde, token.slice(1).replace(/^>/, '')];
  }
  const operator =
    OPERATORS.find((candidate) => token.startsWith(candidate)) ?? '';
  return [operator, token.slice(operator.length)];
};

const hyphenRange = (low, high) => {
  const from = parsePartial(low);
  const to = parsePartial(high);
  const lower =
    from.known === 0
      ? []
      : [{ operator: '>=', version: version(from.tuple, from.prerelease) }];
  if (to.known === 0) {
    return lower;
  }
  const upper =
    to.known === 3
      ? { operator: '<=', version: version(to.tuple, to.prerelease) }
      : { operator: '<', version: bump(to, to.known - 1) };
  return [...lower, upper];
};

const tokensOf = (set) => {
  const tokens = [];
  for (const word of set.split(/\s+/).filter(Boolean)) {
    const previous = tokens.at(-1);
    if (previous !== undefined && /^(?:[<>]=?|=|\^|~>?)$/.test(previous)) {
      tokens[tokens.length - 1] = `${previous}${word}`;
    } else {
      tokens.push(word);
    }
  }
  return tokens;
};

const comparatorsOf = (set) => {
  const words = set.split(/\s+/).filter(Boolean);
  if (words.length === 3 && words[1] === '-') {
    return hyphenRange(words[0], words[2]);
  }
  return tokensOf(set).flatMap((token) => expand(...splitOperator(token)));
};

const holds = ({ operator, version: bound }, candidate) => {
  const order = compare(candidate, bound);
  if (operator === '>') return order > 0;
  if (operator === '>=') return order >= 0;
  if (operator === '<') return order < 0;
  if (operator === '<=') return order <= 0;
  return order === 0;
};

const sameTuple = (left, right) =>
  left.tuple.every((part, index) => part === right.tuple[index]);

const setAdmits = (comparators, candidate) =>
  comparators.every((comparator) => holds(comparator, candidate)) &&
  (candidate.prerelease.length === 0 ||
    comparators.some(
      ({ version: bound }) =>
        bound.prerelease.length > 0 && sameTuple(bound, candidate),
    ));

/**
 * @param {string} versionText an exact version
 * @param {string} range a semver range as written in a manifest
 * @returns {boolean} what `semver.satisfies(versionText, range)` returns
 */
const satisfies = (versionText, range) => {
  const candidate = parseVersion(versionText);
  return range
    .split('||')
    .map((set) => comparatorsOf(set.trim()))
    .some((comparators) => setAdmits(comparators, candidate));
};

module.exports = { satisfies };
