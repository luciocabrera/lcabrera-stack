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

/** A secret every repository has; naming it in a seed is correct, not a leak. */
export const UNIVERSAL_SECRETS = new Set(['GITHUB_TOKEN']);

/**
 * Known offenders, each with the reason it is not fixed and where it is tracked.
 * An entry matching nothing is itself a failure: a stale exemption is how a gate
 * quietly stops covering what it was written for, and it is the same rule the
 * dependency-advisory allowances follow.
 */
export const EXEMPTIONS = [];

/** The `url =` of a config section, read one line at a time so no pattern can span sections. */
const URL_LINE = /^[ \t]*url[ \t]*=[ \t]*(\S+)/;

const ORIGIN_SECTION = '[remote "origin"]';

const GIT_SUFFIX = '.git';

/** The origin URL out of a git config, or nothing when there is no origin. */
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
 * The owner and the repository slug are BOTH here, and neither is the manifest
 * name. That was the assumption this list was first written on — that the
 * package name covers the slug, and that a URL naming the owner names the
 * repository too — and it is false in this repository twice over: the manifest
 * is called `vite-monorepo` while the slug is something else, and the owner
 * appears in no manifest at all. The shape it let through is the most ordinary
 * leak a shipped markdown file has, a `https://github.com/<owner>/<repo>/...`
 * link, which matched nothing and passed.
 *
 * `workspacePaths` is separate from `workspaceNames` because a workspace's
 * directory and its package name are independent strings, and a seed can leak
 * either. This repository proves it: the showcase app is named
 * `vite-react-compiler` and lives in `apps/react-router`, so a blueprint path
 * naming the directory matched no package name and shipped clean (#860).
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

/** Every occurrence, with the line it sits on, so a finding is one edit away. */
export const findingsIn = ({ content, path, words }) =>
  content
    .split('\n')
    .flatMap((line, index) =>
      words
        .filter((word) => line.includes(word))
        .map((word) => ({ line: index + 1, path, word })),
    );

/**
 * A reference to the consumer's command map, in any shape.
 *
 * The two shapes that WORK: an interpolated placeholder, and a `config.`-prefixed
 * declaration in frontmatter. Anything else naming a command key is a placeholder
 * something has taken apart.
 */
const COMMAND_REFERENCE = /commands\.[a-zA-Z][\w-]*/g;

const INTACT_REFERENCE =
  /\{\{[ \t]*commands\.[a-zA-Z][\w-]*[ \t]*\}\}|config\.commands\.[a-zA-Z][\w-]*/g;

const countOf = (line, pattern) => (line.match(pattern) ?? []).length;

/**
 * Lines naming a command key in a form the substituter cannot read.
 *
 * This is not hypothetical, and it is silent both ways. The repository's
 * formatter reads `run: {{commands.install}}` in a workflow as a nested YAML flow
 * mapping and rewrites it as `run: { { commands.install } }`; the substituter's
 * pattern no longer matches, so the file is written with the braces still in it —
 * `sync` reports it as materialised and the consumer gets a `run:` step that
 * names nothing. Quoting the scalar is the fix; this is what says when one has
 * lost its quotes again.
 */
/** A step whose command sits on the `run:` line rather than in a block below it. */
const INLINE_RUN = /^[ \t]*run:[ \t]*\S/;

const YAML_SUFFIXES = ['.yml', '.yaml'];

/**
 * A placeholder sharing its line with `run:` in a YAML seed.
 *
 * Substitution is a plain `replaceAll` with no escaping, so whatever the
 * consumer configured lands verbatim. On a `run:` line that value is inside a
 * YAML scalar, and a command containing a quote — `pnpm --filter '!./e2e' check`
 * is an ordinary thing to configure — ends the scalar early and makes the file
 * unparseable. GitHub then refuses the whole workflow and EVERY job in it stops
 * running, while `sync` reports the file materialised and `doctor` reports no
 * drift: a gate that cannot run and never says so.
 *
 * A block scalar (`run: |` with the placeholder on the next line) is immune to
 * quoting, and to the formatter rewrite `brokenPlaceholdersIn` catches. So the
 * rule is simply that the two never share a line.
 */
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

/**
 * The findings to report, and the exemptions that covered nothing.
 *
 * Both are failures. An exempted file that has become clean means the exemption
 * outlived its reason, and leaving it there would silently exempt whatever that
 * file becomes next.
 */
export const reportFor = ({ exemptions, findings }) => {
  const exempt = new Set(exemptions.map((entry) => entry.path));
  return {
    reported: findings.filter((finding) => !exempt.has(finding.path)),
    unused: exemptions.filter(
      (entry) => !findings.some((finding) => finding.path === entry.path),
    ),
  };
};
