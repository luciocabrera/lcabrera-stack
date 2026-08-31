/**
 * Deciding whether a file `packages/devkit` ships names something only this
 * repository has.
 *
 * The rule travels with the kit; the words do not. A published package carrying
 * a list of this repository's names would be carrying exactly what the kit exists
 * to keep out of shipped files, so the words are derived from the repository on
 * every run and only the deciding half lives here — pure, so it can be tested
 * without a tree. The same split `publish-wiring.test.mjs` makes.
 */

/**
 * The task runner every command in this repository goes through. It is the one
 * word no manifest carries as data, and the one a seed leaks most easily,
 * because writing a command is how you say what a step does. Matched with a
 * trailing space so the letters `vp` inside a word are not a finding.
 */
export const RUNNER_WORDS = ['vp '];

export const UNIVERSAL_SECRETS = new Set(['GITHUB_TOKEN']);

export const EXEMPTIONS = [];

const URL_LINE = /^[ \t]*url[ \t]*=[ \t]*(\S+)/;

const ORIGIN_SECTION = '[remote "origin"]';

const GIT_SUFFIX = '.git';

const originUrl = (gitConfig) => {
  const lines = gitConfig.split('\n');
  const start = lines.findIndex((line) => line.trim() === ORIGIN_SECTION);
  if (start === -1) return undefined;

  for (const line of lines.slice(start + 1)) {
    if (line.trimStart().startsWith('[')) return undefined;
    const match = URL_LINE.exec(line);
    if (match) return match[1];
  }
  return undefined;
};

/**
 * The owner and repository name a remote URL names.
 *
 * Read as the last two path segments rather than by matching a host, so the SSH
 * (`git@host:owner/name.git`), HTTPS and `ssh://` spellings all answer the same
 * and a self-hosted forge answers too.
 *
 * @returns {{ name: string, owner: string } | undefined}
 */
export const repositoryIdentity = (gitConfig) => {
  const url = originUrl(gitConfig);
  if (url === undefined) return undefined;

  const trimmed = url.endsWith(GIT_SUFFIX)
    ? url.slice(0, -GIT_SUFFIX.length)
    : url;
  const segments = trimmed.split(/[/:]/).filter((segment) => segment !== '');
  if (segments.length < 2) return undefined;

  const [owner, name] = segments.slice(-2);
  return { name, owner };
};

/**
 * What a seed may not contain.
 *
 * The owner and the repository slug are BOTH here, and neither is derived from
 * the manifest name. That was the assumption this list was first written on —
 * that the package name covers the slug, and that a URL naming the owner names
 * the repository too — and it let through the most ordinary leak a shipped
 * markdown file has, a `https://github.com/<owner>/<repo>/...` link, which
 * matched nothing and passed.
 *
 * The root manifest and the repository slug happen to be the same string today.
 * **That is a coincidence, and collecting them separately is not redundant.**
 * They were different until the repository was renamed, they are independent
 * fields that nothing keeps in step, and the owner still appears in no manifest
 * at all. A future reader who deletes one of these inputs because it looks like
 * a duplicate of the other reopens the hole; the test fixture keeps them
 * deliberately divergent so the gate is exercised the way it has to work.
 *
 * `workspacePaths` is separate from `workspaceNames` because a workspace's
 * directory and its package name are independent strings, and a seed can leak
 * either. `packages/ui` is the case to hold in mind: it publishes as
 * `@lcabrera/ui`, neither string contains the other, so a blueprint path naming
 * the directory matches nothing derived from the manifests. The file that
 * proved it did not ship clean — it was exempted outright — but lifting the
 * exemption is what exposed the hole: the gate reported its three package-name
 * lines and left the blueprint path alone (#860).
 *
 * Pick that pair rather than a workspace whose directory ends in its own package
 * name. `apps/showcase` holds `showcase`, and matching is `includes`, so it
 * would demonstrate the opposite of the point.
 *
 * @param {{ repositoryName: string, repositoryOwner: string,
 *   repositorySlug: string, workspaceNames: string[],
 *   workspacePaths: string[], secretNames: string[] }} args
 */
export const forbiddenWords = ({
  repositoryName,
  repositoryOwner,
  repositorySlug,
  secretNames,
  workspaceNames,
  workspacePaths,
}) => [
  ...new Set([
    repositoryName,
    repositoryOwner,
    repositorySlug,
    ...workspaceNames,
    ...workspacePaths,
    ...secretNames
      .filter((name) => !UNIVERSAL_SECRETS.has(name))
      .map((name) => `secrets.${name}`),
    ...RUNNER_WORDS,
  ]),
];

export const findingsIn = ({ content, path, words }) =>
  content
    .split('\n')
    .flatMap((line, index) =>
      words
        .filter((word) => line.includes(word))
        .map((word) => ({ line: index + 1, path, word })),
    );

const COMMAND_REFERENCE = /commands\.[a-zA-Z][\w-]*/g;

const INTACT_REFERENCE =
  /\{\{[ \t]*commands\.[a-zA-Z][\w-]*[ \t]*\}\}|config\.commands\.[a-zA-Z][\w-]*/g;

const countOf = (line, pattern) => (line.match(pattern) ?? []).length;

const INLINE_RUN = /^[ \t]*run:[ \t]*\S/;

const YAML_SUFFIXES = ['.yml', '.yaml'];

export const inlinePlaceholdersIn = ({ content, path }) => {
  if (!YAML_SUFFIXES.some((suffix) => path.endsWith(suffix))) return [];

  return content
    .split('\n')
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(
      (entry) =>
        INLINE_RUN.test(entry.line) && entry.line.includes('{{commands.'),
    )
    .map((entry) => ({ line: entry.number, path }));
};

export const brokenPlaceholdersIn = ({ content, path }) =>
  content
    .split('\n')
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(
      (entry) =>
        countOf(entry.line, COMMAND_REFERENCE) !==
        countOf(entry.line, INTACT_REFERENCE),
    )
    .map((entry) => ({ line: entry.number, path }));

export const reportFor = ({ exemptions, findings }) => {
  const exempt = new Set(exemptions.map((entry) => entry.path));
  return {
    reported: findings.filter((finding) => !exempt.has(finding.path)),
    unused: exemptions.filter(
      (entry) => !findings.some((finding) => finding.path === entry.path),
    ),
  };
};
