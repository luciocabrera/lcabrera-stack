/*
 * The extra CI steps a consumer's toolchain needs before it can install.
 *
 * A shipped workflow starts from an empty runner, and `{{commands.install}}` is
 * only runnable there if the tool it names is already present. On GitHub's
 * `ubuntu24` image, after `actions/setup-node`, that is true for `npm` and
 * `yarn` and false for `pnpm`, `bun` and `vp` — the last of which is a project
 * dependency, so installing it is the very step that was about to run. The
 * workflows therefore enable corepack (which covers pnpm and yarn at the version
 * `packageManager` pins) and leave this hook for the two runners corepack cannot
 * reach.
 *
 * The value is YAML **lines**, not a step schema. Expressing `uses:`, `with:`
 * and their nesting as JSON would be inventing a second spelling of YAML that
 * only ever renders back into the first, and it would bound what a consumer can
 * express to whatever this module thought of. Lines are verbatim: a repository
 * whose toolchain needs something nobody here anticipated writes it directly.
 *
 * Nothing here validates the YAML. A malformed step fails the workflow run
 * loudly, at the point someone is already reading Actions output — whereas a
 * validator here could only reject the shapes it knew about, which is the bound
 * this design exists to avoid.
 */

/*
 * Written as a YAML COMMENT in the templates, and matched as one here. A bare
 * `{{ci.setup}}` line sits where a sequence item belongs, so the template stops
 * being valid YAML — `vp fmt` parses these files and refuses the whole run
 * ("All mapping items must start at the same column"), and every other YAML
 * tool would too. As a comment the template parses like any workflow, and the
 * whole line is still what gets replaced.
 */
const PLACEHOLDER =
  /^([ \t]*)#[ \t]*\{\{[ \t]*ci\.setup[ \t]*\}\}[ \t]*\r?\n/gm;

const indented = ({ indent, lines }) =>
  lines
    .map((line) => (line.trim() === '' ? '' : `${indent}${line}`))
    .join('\n');

/**
 * @param {{ content: string, setup?: readonly string[] }} args
 * @returns {string}
 */
export const substituteCiSetup = ({ content, setup = [] }) =>
  content.replaceAll(PLACEHOLDER, (_match, indent) =>
    setup.length === 0 ? '' : `${indented({ indent, lines: setup })}\n\n`,
  );
