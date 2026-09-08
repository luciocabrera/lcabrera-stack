/**
 * Which command each `devkit` word runs, and the usage text when none matches.
 *
 * Separate from the `devkit.mjs` entry point because that file carries the
 * shebang: a file a shell executes is an entry, and a file another module
 * imports is a module. Keeping the routing here lets a test call `runCommand`
 * without importing an executable.
 */

import { runClosure } from './command-closure.mjs';
import { runCreate } from './command-create.mjs';
import { runInit } from './command-init.mjs';
import { runDoctor, runSync } from './command-sync.mjs';

const USAGE = [
  'usage:',
  '  devkit create <directory> [--profile <name>]',
  '  devkit init [--profile <name>] [--force] [--upgrade]',
  '  devkit sync [--profile <name>]',
  '  devkit doctor [--profile <name>] [--check] [--verbose]',
  '  devkit doctor --accept <path> --reason "<why>"',
  '  devkit closure [--profile <name>] <directory> [<directory> ...]',
  '  devkit closure [--profile <name>] --shipped',
].join('\n');

const COMMANDS = {
  closure: runClosure,
  create: runCreate,
  doctor: runDoctor,
  init: runInit,
  sync: runSync,
};

const withoutSeparator = (argv) => argv.filter((entry) => entry !== '--');

const HELP_FLAGS = new Set(['--help', '-h']);
const HELP_COMMAND = 'help';

const asksForHelp = (entries) =>
  entries[0] === HELP_COMMAND || entries.some((entry) => HELP_FLAGS.has(entry));

/** @param {{ argv: string[], root: string }} args */
export const runCommand = ({ argv, root }) => {
  const entries = withoutSeparator(argv);

  if (asksForHelp(entries)) {
    console.log(USAGE);
    return 0;
  }

  const [command, ...rest] = entries;
  const handler = Object.hasOwn(COMMANDS, command ?? '')
    ? COMMANDS[command]
    : undefined;

  if (handler === undefined) {
    console.error(USAGE);
    return 1;
  }
  return handler(rest, root);
};
