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
export const flagValue = (name, argv = process.argv) => {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
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
