/**
 * How a root script reads its own input: argv flags and piped stdin.
 *
 * Both helpers were copy-pasted rather than shared — `flagValue` five times
 * byte-for-byte, `readStdin` twice — and four of those five `flagValue` copies
 * are the argv readers for ENFORCED gates (`pr:verify`, `issue:verify`,
 * `branch:verify`, plus `plan:issues`). A parsing fix applied to one copy left
 * the other gates on the old behaviour, silently, which is the failure mode
 * `.claude/rules/scripts.md` means by "shared logic imported, not copy-pasted".
 *
 * Governed by .claude/rules/scripts.md.
 */
import process from 'node:process';

/**
 * The value following `--name` in argv, or `undefined` when the flag is absent.
 *
 * Returns `undefined` rather than throwing for a trailing flag with no value:
 * every caller already treats "absent" and "given nothing" the same way, and a
 * throw here would turn a malformed invocation into a stack trace instead of
 * the gate's own usage message. (pure w.r.t. argv)
 */
/**
 * argv with the separator a task runner forwards removed.
 *
 * `vp run <task> -- <args>` puts a bare `--` in front of the forwarded
 * arguments, which is invisible to the person typing the documented form and
 * arrives here as a positional. Every reader below starts from this.
 */
export const withoutSeparator = (argv = process.argv) =>
  argv.filter((entry) => entry !== '--');

/** The nth positional argument, counting past node and the script itself. */
export const positional = (index, argv = process.argv) =>
  withoutSeparator(argv)[index];

export const flagValue = (name, argv = process.argv) => {
  const index = argv.indexOf(name);
  if (index === -1) return undefined;
  // A task runner forwards its own `--` separator into argv, so it can sit
  // between a flag and its value. Skipping it is what makes the documented
  // `vp run <task> -- --flag value` form behave like the bare invocation.
  const next = argv[index + 1];
  return next === '--' ? argv[index + 2] : next;
};

/** Digits only — a leading `#` is stripped before this sees the value. */
const DIGITS = /^\d+$/;

/**
 * The pull request number a `--pr` argument names, or a throw saying why not.
 *
 * **`#738` is accepted**, not rejected, because that is how this repository
 * writes a pull request everywhere else — issue bodies, PR references, doc links
 * — so it is the form someone will paste, not an exotic one. `Number('#738')` is
 * `NaN`, and a `NaN` reaching a gate runs it against `#NaN`: a 404 per gate and
 * nothing anywhere saying the input was the problem.
 *
 * Everything else throws, naming the value it was given. Two things it must not
 * do: fall through to the caller's "no pull request named" branch, which would
 * turn a typo into a sweep of every open pull request, and reach an API path,
 * where the value stops being recognisable as the thing that was typed.
 */
export const parsePullNumber = (raw) => {
  const text = String(raw ?? '').trim();
  const digits = text.startsWith('#') ? text.slice(1) : text;
  const number = Number(digits);
  if (!DIGITS.test(digits) || !Number.isSafeInteger(number) || number < 1) {
    throw new Error(
      `--pr must be a positive pull request number, optionally written as #738 — got ${JSON.stringify(raw)}`,
    );
  }
  return number;
};

const REPOSITORY = /^(?<owner>[\w.-]+)\/(?<name>[\w.-]+)$/;
const NOT_A_NAME = new Set(['.', '..']);

/**
 * A repository as `owner/name`, or a throw saying why not.
 *
 * Validated because the value is interpolated into every `gh api` path the sweep
 * builds and is forwarded to both gates, and every wrong shape fails the same
 * indistinguishable way: `''`, `foo` and `a/b/c` each produce a bare
 * `Not Found (HTTP 404)` that never mentions the repository. The empty string is
 * the worst of them — `??` does not catch it, so it reaches the log as
 * `Reconciling 1 pull request(s) in .` where the only trace of it is a full stop.
 *
 * Dot-only segments are refused for the same reason a path is not built from
 * unchecked input, not because a traversal was demonstrated: `gh api
 * repos/../../user` returns 404 here rather than reaching another endpoint.
 */
export const parseRepository = (raw) => {
  const groups = REPOSITORY.exec(String(raw ?? '').trim())?.groups;
  if (
    groups === undefined ||
    NOT_A_NAME.has(groups.owner) ||
    NOT_A_NAME.has(groups.name)
  ) {
    throw new Error(`--repo must be owner/name — got ${JSON.stringify(raw)}`);
  }
  return `${groups.owner}/${groups.name}`;
};

const NODE_ID = /^\w[\w-]*={0,2}$/;

export const parseThreadId = (raw) => {
  const text = String(raw ?? '').trim();
  if (!NODE_ID.test(text)) {
    throw new Error(
      `--resolve must be a GitHub thread node id such as PRRT_kwDOAbCd — got ${JSON.stringify(raw)}`,
    );
  }
  return text;
};

/**
 * Everything piped in, or `''` when nothing is.
 *
 * The `isTTY` guard is what stops an interactive run hanging forever on a read
 * that will never receive data — these scripts are run by hand as often as by
 * CI.
 */
export const readStdin = async (stream = process.stdin) => {
  if (stream.isTTY) {
    return '';
  }
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
};
