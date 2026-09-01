/**
 * The YAML subset the two doc registers are written in, parsed without a YAML
 * dependency: scalars, block lists, flow lists, and a block list of two-key
 * maps (`evidence:`).
 *
 * Why not `coordination-parse.mjs`'s parser, which this repo already has: the
 * coordination schema allows no nesting, so that one drops the second line of a
 * list item and knows nothing about `[a, b]`. Both shapes are load-bearing here
 * — `evidence` is a list of maps and the planning block writes `issues` inline —
 * and widening a published package's parser to suit two documents outside it
 * would put the register's schema in a package that must not carry this repo's
 * data. See `docs/product/README.md` and `docs/agents/planning/README.md` for
 * the two schemas themselves.
 *
 * Every export is pure. Parse errors are returned, never thrown: a malformed
 * block is a finding the gate reports beside the others, not a crash that hides
 * the rest.
 */

const QUOTES = new Set(["'", '"']);

const unquote = (value) => {
  const first = value.slice(0, 1);
  const quoted = QUOTES.has(first) && value.length > 1 && value.endsWith(first);
  return quoted ? value.slice(1, -1) : value;
};

const parseFlowList = (value) =>
  value
    .slice(1, -1)
    .split(',')
    .map((item) => unquote(item.trim()))
    .filter((item) => item !== '');

const readPair = (text) => {
  const colon = text.indexOf(':');
  if (colon <= 0) {
    return undefined;
  }
  const key = text.slice(0, colon);
  return /^[A-Za-z][\w-]*$/.test(key)
    ? { key, value: text.slice(colon + 1).trim() }
    : undefined;
};

const scalarOrFlow = (value, line, errors) => {
  if (value === '') {
    return undefined;
  }
  if (!value.startsWith('[')) {
    return unquote(value);
  }
  if (!value.endsWith(']')) {
    errors.push(`line ${line}: unterminated flow list`);
    return [];
  }
  return parseFlowList(value);
};

const indentOf = (line) => line.length - line.trimStart().length;

const frontmatterBlock = (source) => {
  if (!source.startsWith('---\n')) {
    return undefined;
  }
  const end = source.indexOf('\n---', 3);
  return end === -1 ? undefined : source.slice(4, end);
};

export const bodyOf = (source) => {
  if (!source.startsWith('---\n')) {
    return source;
  }
  const end = source.indexOf('\n---', 3);
  return end === -1 ? source : source.slice(source.indexOf('\n', end + 1) + 1);
};

const pushItem = (state, value, line) => {
  if (state.key === undefined) {
    state.errors.push(`line ${line}: list item outside any field`);
    return;
  }
  state.fields[state.key].push(value);
};

const readListItem = (state, text, line) => {
  const pair = readPair(text);
  if (pair === undefined) {
    state.map = undefined;
    pushItem(state, unquote(text), line);
    return;
  }
  state.map = { [pair.key]: unquote(pair.value) };
  pushItem(state, state.map, line);
};

const readMapKey = (state, text, line) => {
  const pair = readPair(text);
  if (state.map === undefined || pair === undefined) {
    state.errors.push(`line ${line}: cannot read \`${text}\``);
    return;
  }
  state.map[pair.key] = unquote(pair.value);
};

const readTopLevel = (state, text, line) => {
  const pair = readPair(text);
  if (pair === undefined) {
    state.errors.push(`line ${line}: cannot read \`${text}\``);
    return;
  }
  const value = scalarOrFlow(pair.value, line, state.errors);
  state.fields[pair.key] = value ?? [];
  state.key = value === undefined ? pair.key : undefined;
  state.map = undefined;
};

export const parseFrontmatter = (source) => {
  const block = frontmatterBlock(source);
  if (block === undefined) {
    return undefined;
  }
  const state = { errors: [], fields: {}, key: undefined, map: undefined };
  for (const [index, raw] of block.split('\n').entries()) {
    const text = raw.trim();
    if (text === '' || text.startsWith('#')) {
      continue;
    }
    if (indentOf(raw) === 0) {
      readTopLevel(state, text, index + 2);
    } else if (text.startsWith('- ')) {
      readListItem(state, text.slice(2).trim(), index + 2);
    } else {
      readMapKey(state, text, index + 2);
    }
  }
  return { errors: state.errors, fields: state.fields };
};
