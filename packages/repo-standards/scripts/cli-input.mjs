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

export const withoutSeparator = (argv = process.argv) =>
  argv.filter((entry) => entry !== '--');

export const positional = (index, argv = process.argv) =>
  withoutSeparator(argv)[index];

export const flagValue = (name, argv = process.argv) => {
  const index = argv.indexOf(name);
  if (index === -1) return undefined;
  const next = argv[index + 1];
  return next === '--' ? argv[index + 2] : next;
};

const DIGITS = /^\d+$/;

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
