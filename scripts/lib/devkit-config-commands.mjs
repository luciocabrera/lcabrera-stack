/**
 * Deciding which commands a created tree's `devkit.config.json` hands its
 * workflows and hooks, so the created-workspace gate can run each one
 * (verify-devkit-workspace.mjs).
 *
 * Pure: the CLI hands in the parsed `commands` block.
 */

/**
 * @type {readonly string[]}
 */
const REQUIRED_COMMAND_KEYS = ['audit', 'test'];

const isRunnable = (command) =>
  typeof command === 'string' && command.trim() !== '';

/**
 * @param {Readonly<Record<string, unknown>> | undefined} commands
 * @returns {{ findings: string[],
 *             runs: { command: string, label: string }[] }}
 */
export const configuredCommandRuns = (commands = {}) => ({
  findings: REQUIRED_COMMAND_KEYS.filter(
    (key) => !isRunnable(commands[key]),
  ).map(
    (key) =>
      `the created tree's \`devkit.config.json\` sets no runnable \`commands.${key}\`, so the workflow and hook steps that read it are not written`,
  ),
  runs: Object.entries(commands)
    .filter(([, command]) => isRunnable(command))
    .toSorted(([left], [right]) => left.localeCompare(right))
    .map(([key, command]) => ({
      command,
      label: `commands.${key}: ${command}`,
    })),
});
