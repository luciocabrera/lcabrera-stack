/**
 * Pure half of the inventory-drift gate: which `*.util.ts`/`*.util.tsx`
 * VALUE exports (`export const`/`export function`) are missing from their
 * package's own `INVENTORY.md`.
 *
 * Scope is deliberately narrow. `INVENTORY.md` in `packages/ui/src`,
 * `packages/server/src` and `apps/showcase/src` differ on purpose —
 * `ui` is table-driven, `server` names private helpers in prose parentheticals
 * — so the only matching rule that works for both is "the symbol's name
 * appears in backticks somewhere in the file", not "the symbol has a row".
 * That rule was proven by the audit that closed #579/#811, and its own
 * retrospective is what asked for this gate. Hooks, constants, types and
 * components are NOT covered — including a `export type`/`export interface`
 * sitting inside an otherwise-governed `.util.ts` file — because those
 * sections are curated by design (the `ui` Types table is headed "Key
 * Exports", not "Exports"), so a completeness rule there would misreport
 * correct documentation as drift. See #817.
 */

/** Each tree this gate covers, and the `INVENTORY.md` that documents it. */
export const INVENTORY_TREES = [
  { inventory: 'packages/ui/src/INVENTORY.md', root: 'packages/ui/src' },
  {
    inventory: 'packages/server/src/INVENTORY.md',
    root: 'packages/server/src',
  },
  {
    inventory: 'apps/showcase/src/INVENTORY.md',
    root: 'apps/showcase/src',
  },
];

/** A real `*.util.ts`/`*.util.tsx` source file — a `.util.test.ts(x)` file
 * ends in `.test.ts(x)`, not `.util.ts(x)`, so it never matches this. */
const UTIL_FILE = /\.util\.tsx?$/;

/** The tree a tracked file belongs to, or undefined if it belongs to none. */
export const treeFor = (filePath) =>
  INVENTORY_TREES.find((tree) => filePath.startsWith(`${tree.root}/`));

/** Every tracked `*.util.ts`/`*.util.tsx` file paired with its tree. */
export const utilFileEntries = (trackedPaths) =>
  trackedPaths
    .filter((filePath) => UTIL_FILE.test(filePath))
    .map((file) => ({ file, tree: treeFor(file) }))
    .filter((entry) => entry.tree !== undefined);

// Anchored to the start of a (possibly indented) line so a JSDoc example —
// ` * export async function loader(...) {` — is never mistaken for a real
// declaration: the `*` isn't whitespace, so `^[ \t]*` cannot reach past it.
// `[ \t]`, not `\s`, throughout: under the `m` flag `\s` also matches `\n`,
// and several adjacent `\s*`/`\s+` groups can then overlap across line
// breaks in more than one way — the super-linear backtracking Sonar S8786
// flags. A single declaration line never needs to span a newline here.
const EXPORT_NAME =
  /^[ \t]*export[ \t]+(?:const|(?:async[ \t]+)?function)[ \t]+([A-Za-z_$][\w$]*)/gm;

/** Every top-level `export const`/`export function` name in a source file. */
export const exportedSymbolNames = (source) => [
  ...new Set([...source.matchAll(EXPORT_NAME)].map(([, name]) => name)),
];

/** Whether `symbol` is named in backticks anywhere in an INVENTORY.md's text. */
export const isDocumented = (inventoryText, symbol) =>
  inventoryText.includes(`\`${symbol}\``);

/**
 * Every `(file, symbol)` this gate would currently flag, before the baseline
 * is applied — `entries` are `{ file, tree, source }` with `source` already
 * read, and `inventoryTextByTree` maps a tree's `root` to its `INVENTORY.md`
 * text, so this stays pure and I/O lives entirely in the caller.
 */
export const missingExports = (entries, inventoryTextByTree) =>
  entries.flatMap(({ file, source, tree }) => {
    const inventoryText = inventoryTextByTree.get(tree.root);
    return exportedSymbolNames(source)
      .filter((symbol) => !isDocumented(inventoryText, symbol))
      .map((symbol) => ({ file, symbol }));
  });

/** Baseline shape: `{ "<file>": ["<symbol>", ...] }`, sorted for a stable diff. */
export const toBaseline = (findings) => {
  const byFile = new Map();
  for (const { file, symbol } of findings) {
    const symbols = byFile.get(file) ?? [];
    symbols.push(symbol);
    byFile.set(file, symbols);
  }
  return Object.fromEntries(
    [...byFile.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([file, symbols]) => [
        file,
        [...new Set(symbols)].sort((a, b) => a.localeCompare(b)),
      ]),
  );
};

export const isBaselined = (baseline, file, symbol) =>
  (baseline[file] ?? []).includes(symbol);

/**
 * A finding no longer missing — the file was fixed, or dropped entirely.
 * Keyed on an escaped NUL separator: a raw embedded NUL byte reads as a
 * binary file to grep and other line-based tooling, and neither a repo path
 * nor a JS identifier can legitimately contain one either way.
 */
export const staleBaselineEntries = (baseline, findings) => {
  const stillMissing = new Set(
    findings.map(({ file, symbol }) => `${file}\0${symbol}`),
  );
  return Object.entries(baseline).flatMap(([file, symbols]) =>
    symbols
      .filter((symbol) => !stillMissing.has(`${file}\0${symbol}`))
      .map((symbol) => ({ file, symbol })),
  );
};

export const describeFinding = ({ file, symbol }) =>
  `${file}: \`${symbol}\` is not named anywhere in its tree's INVENTORY.md`;

/** A dedicated message for a stale entry — the opposite claim of `describeFinding`,
 * so it must not reuse that wording ("is not named…") for something now documented. */
export const describeStaleEntry = ({ file, symbol }) =>
  `${file}: \`${symbol}\` was grandfathered but is now documented, or the file is gone`;
