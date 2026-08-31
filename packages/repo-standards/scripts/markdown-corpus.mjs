/**
 * The governed markdown corpus — which documents the doc gates read, and which
 * they deliberately do not.
 *
 * Shared by `verify-docs-paths.mjs` ("does every path a doc names resolve?")
 * and `verify-renamed-mentions.mjs` ("did a rename leave a stale name
 * behind?"). One definition on purpose: two walkers drift, and the symptom of a
 * doc gate quietly reading fewer files is a clean pass — indistinguishable from
 * a corpus with nothing wrong in it.
 *
 * The always-ignored list carries universal entries only, for that same reason:
 * a wrong entry makes the gate neither stricter nor looser, it makes it silently
 * read fewer documents. Everything else a repository exempts arrives as
 * configuration. There is deliberately no `/decisions/` fragment — exempting
 * dated records wholesale hid every dead link in them, so they are filtered per
 * token by `enforcedTokens` instead, which keeps the paths an ADR names exempt
 * as historical record while the links it asks you to follow are not.
 *
 * The walk stops at a separate checkout — a directory holding a `.git` entry,
 * which is a linked worktree or a nested clone. Descending into one scans every
 * document a second time and resolves its relative references against THIS
 * root, so a doc correct in its own tree is reported broken here. That path is
 * gitignored or outside the tree entirely, so CI's fresh checkout never has one
 * and the gate failed only on the machine that had run `coordination:claim` —
 * the command the agent instructions recommend. A gate that fires locally and
 * nowhere else trains people into `--no-verify`, which then stops catching
 * everything else the hook guards.
 *
 * It is matched by "is a checkout" and deliberately NOT by reading
 * `.gitignore`. A root-only reader is incomplete wherever nested gitignore
 * files exist, and gitignore lines are patterns rather than names, so a naive
 * reader risks skipping a directory of real documents — and the symptom of that
 * is the gate quietly checking less, which is the failure these gates exist to
 * prevent. `markdown-corpus.test.mjs` pins the behaviour; this is the argument
 * against replacing it.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const ALWAYS_IGNORED = ['CHANGELOG.md', 'node_modules/', '_TEMPLATE.md'];

export const isIgnoredDoc = ({ docPath, ignoredDocs }) =>
  [...ALWAYS_IGNORED, ...ignoredDocs].some((fragment) =>
    docPath.includes(fragment),
  );

const SKIPPED_DIRS = new Set([
  '.git',
  '.react-router',
  '.tmp',
  'build',
  'coverage',
  'dist',
  'node_modules',
]);

const isSeparateCheckout = (entries, prefix) =>
  prefix !== '' && entries.some((entry) => entry.name === '.git');

const walkMarkdown = (dir, prefix = '') => {
  const entries = readdirSync(dir, { withFileTypes: true });
  if (isSeparateCheckout(entries, prefix)) {
    return [];
  }
  return entries.flatMap((entry) => {
    const relativePath = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      return SKIPPED_DIRS.has(entry.name)
        ? []
        : walkMarkdown(join(dir, entry.name), relativePath);
    }
    return entry.name.endsWith('.md') ? [relativePath] : [];
  });
};

export const documentedFiles = ({ ignoredDocs = [], repoRoot }) =>
  walkMarkdown(repoRoot).filter(
    (docPath) => !isIgnoredDoc({ docPath, ignoredDocs }),
  );
