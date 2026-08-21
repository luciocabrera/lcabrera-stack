/**
 * The governed markdown corpus — which documents the doc gates read, and which
 * they deliberately do not.
 *
 * Shared by `verify-docs-paths.mjs` ("does every path a doc names resolve?")
 * and `verify-renamed-mentions.mjs` ("did a rename leave a stale name
 * behind?"). One definition on purpose: two walkers drift, and the symptom of a
 * doc gate quietly reading fewer files is a clean pass — indistinguishable from
 * a corpus with nothing wrong in it.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Documents whose paths are illustrative or forward-looking by design.
 *
 * Universal entries only. A changelog names paths as they were, a report is
 * generated, and a template's paths are placeholders to be replaced — those hold
 * anywhere. Everything else a repository exempts is its own, and arrives as
 * configuration, because a wrong entry here does not make the gate stricter or
 * looser: it makes it silently read fewer documents, and a doc gate reading less
 * reports the same clean pass as a corpus with nothing wrong in it.
 *
 * Deliberately NOT a `/decisions/` fragment. Exempting dated records wholesale
 * hid every dead link in them; they are filtered per TOKEN by `enforcedTokens`
 * instead, so the paths an ADR *names* stay exempt as historical record while
 * the links it asks you to *follow* do not.
 */
const ALWAYS_IGNORED = ['CHANGELOG.md', 'node_modules/', '_TEMPLATE.md'];

export const isIgnoredDoc = ({ docPath, ignoredDocs }) =>
  [...ALWAYS_IGNORED, ...ignoredDocs].some((fragment) =>
    docPath.includes(fragment),
  );

/** Directories that never contain governed documentation. */
const SKIPPED_DIRS = new Set([
  '.git',
  '.react-router',
  '.tmp',
  'build',
  'coverage',
  'dist',
  'node_modules',
]);

/**
 * Whether this directory is a *separate checkout of the repo* rather than part
 * of this one — a linked worktree (where `.git` is a file) or a nested clone
 * (where it is a directory). Both are visible to the `readdirSync` the walk
 * already performs, so this costs nothing and needs no subprocess.
 *
 * Descending into one scans every document a second time and resolves its
 * relative references against THIS root, so a doc that is correct in its own
 * tree gets reported broken here. `coordination:claim` — which AGENTS.md
 * recommends whenever other agents are active — puts a full linked checkout
 * beside the repo, and because that path is gitignored (or outside the tree
 * entirely), CI's fresh checkout never has one: the gate failed only on the
 * machine that ran the recommended command, and the only way past it was
 * `--no-verify`. A gate that fires locally and nowhere else trains people to
 * bypass the pre-push hook, which then stops catching everything else it
 * guards.
 *
 * Matched by "is a checkout" rather than "is gitignored" deliberately. Reading
 * `.gitignore` would cover this case too, but root-only is incomplete (this
 * repo has nine nested gitignore files) and gitignore lines are patterns, not
 * names — a naive reader risks skipping a directory of real documents, and the
 * symptom of that is the gate quietly checking less. Silent loss of coverage is
 * the failure these gates exist to prevent.
 */
const isSeparateCheckout = (entries, prefix) =>
  prefix !== '' && entries.some((entry) => entry.name === '.git');

/**
 * Every markdown file under the repo, found by walking rather than by shelling
 * out to `git ls-files`: `verify-docs-paths.mjs` launches no subprocess at all,
 * so a PATH-resolved process can never be substituted underneath a gate that
 * runs on every push.
 */
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

/** Repo-relative paths of every governed document. */
export const documentedFiles = ({ ignoredDocs = [], repoRoot }) =>
  walkMarkdown(repoRoot).filter(
    (docPath) => !isIgnoredDoc({ docPath, ignoredDocs }),
  );
