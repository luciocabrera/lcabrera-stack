/**
 * The one `createRule` factory, and the one place the docs URL is built.
 *
 * This URL is not internal. ESLint prints `meta.docs.url` beside every finding,
 * so whatever is written here appears in a consumer's own terminal — a wrong
 * value is a broken link in someone else's build, and nothing in this repository
 * would ever surface it.
 *
 * It is shared rather than repeated because repeating it is exactly how it went
 * wrong: each rule declared its own factory, two were repointed at the
 * repository and the other eight kept shipping `https://example.com/rule/<name>`
 * — the placeholder the first rule was scaffolded from. One definition cannot
 * drift from itself.
 *
 * The anchor form is what the README already publishes: every rule has a
 * `### \`<name>\`` heading, which GitHub renders as `#<name>`. The colocated
 * test asserts that heading exists for each registered rule, so adding a rule
 * without documenting it fails rather than shipping a link to nothing.
 */

import { ESLintUtils } from '@typescript-eslint/utils';

const README_URL =
  'https://github.com/luciocabrera/lcabrera-stack/blob/main/packages/eslint-local-rules/README.md';

export const ruleDocsUrl = (name: string) => `${README_URL}#${name}`;

export const createRule = ESLintUtils.RuleCreator(ruleDocsUrl);
