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
export const EXEMPTIONS = [
  {
    path: 'rules/routes-data.md',
    reason:
      "names this repository's UI and server packages in prose; making it portable needs a mechanism for package names that does not exist yet — tracked in #860",
  },
];

/**
 * What a seed may not contain. The repository's own package name covers its
 * slug, and any URL naming the owner names the repository too, so the owner
 * needs no entry of its own.
 *
 * @param {{ repositoryName: string, workspaceNames: string[],
 *   secretNames: string[] }} args
 */
export const forbiddenWords = ({
  repositoryName,
  secretNames,
  workspaceNames,
}) => [
  ...new Set([
    repositoryName,
    ...workspaceNames,
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
