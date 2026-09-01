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

const UTIL_FILE = /\.util\.tsx?$/;

export const treeFor = (filePath) =>
  INVENTORY_TREES.find((tree) => filePath.startsWith(`${tree.root}/`));

export const utilFileEntries = (trackedPaths) =>
  trackedPaths
    .filter((filePath) => UTIL_FILE.test(filePath))
    .map((file) => ({ file, tree: treeFor(file) }))
    .filter((entry) => entry.tree !== undefined);

const EXPORT_NAME =
  /^[ \t]*export[ \t]+(?:const|(?:async[ \t]+)?function)[ \t]+([A-Za-z_$][\w$]*)/gm;

export const exportedSymbolNames = (source) => [
  ...new Set([...source.matchAll(EXPORT_NAME)].map(([, name]) => name)),
];

export const isDocumented = (inventoryText, symbol) =>
  inventoryText.includes(`\`${symbol}\``);

export const missingExports = (entries, inventoryTextByTree) =>
  entries.flatMap(({ file, source, tree }) => {
    const inventoryText = inventoryTextByTree.get(tree.root);
    return exportedSymbolNames(source)
      .filter((symbol) => !isDocumented(inventoryText, symbol))
      .map((symbol) => ({ file, symbol }));
  });

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

export const describeStaleEntry = ({ file, symbol }) =>
  `${file}: \`${symbol}\` was grandfathered but is now documented, or the file is gone`;
