/**
 * The one check every panel tool call passes before it runs: the tool is one
 * of the three read-only file tools, and every path it names stays inside the
 * exported case tree. A read anywhere else is refused, so a session cannot
 * reach the repository, its history or the builder's notes by absolute path.
 * The session options every panel seat runs with live here too, so a seat run
 * outside `vp run adjudicate:panel` is held to the same scope.
 */
import { existsSync, realpathSync } from 'node:fs';
import { isAbsolute, resolve, sep } from 'node:path';

export const PANEL_TOOLS = ['Read', 'Glob', 'Grep'];

const PATH_FIELDS = { Glob: ['path'], Grep: ['path'], Read: ['file_path'] };

const PATTERN_FIELDS = { Glob: ['pattern'], Grep: ['glob'], Read: [] };

const within = ({ path, tree }) =>
  path === tree || path.startsWith(`${tree}${sep}`);

const inside = ({ path, tree }) => {
  const resolved = resolve(tree, path);
  return (
    within({ path: resolved, tree }) &&
    (!existsSync(resolved) ||
      within({ path: realpathSync(resolved), tree: realpathSync(tree) }))
  );
};

const leavesTree = (pattern) =>
  isAbsolute(pattern) ||
  pattern.startsWith('~') ||
  pattern.split(/[/\\]/u).includes('..');

export const scopeDecision = ({ input, toolName, tree }) => {
  if (!PANEL_TOOLS.includes(toolName)) {
    return { allow: false, reason: `${toolName} is not a panel tool` };
  }
  const paths = PATH_FIELDS[toolName]
    .map((field) => input[field])
    .filter((value) => value !== undefined);
  const patterns = PATTERN_FIELDS[toolName]
    .map((field) => input[field])
    .filter((value) => value !== undefined);
  const outside = [
    ...paths.filter(
      (path) => typeof path !== 'string' || !inside({ path, tree }),
    ),
    ...patterns.filter(
      (pattern) => typeof pattern !== 'string' || leavesTree(pattern),
    ),
  ];
  return outside.length === 0
    ? { allow: true }
    : {
        allow: false,
        reason: `${outside.join(', ')} is outside the case tree`,
      };
};

export const scopeHook =
  ({ tree }) =>
  async ({ tool_input: input, tool_name: toolName }) => {
    const { allow, reason } = scopeDecision({ input, toolName, tree });
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: allow ? 'allow' : 'deny',
        ...(allow ? {} : { permissionDecisionReason: reason }),
      },
    };
  };

export const panelSessionOptions = ({
  maxTurns,
  model,
  systemPrompt,
  tree,
}) => ({
  cwd: tree,
  hooks: { PreToolUse: [{ hooks: [scopeHook({ tree })] }] },
  maxTurns,
  mcpServers: {},
  model,
  permissionMode: 'dontAsk',
  persistSession: false,
  settingSources: [],
  strictMcpConfig: true,
  systemPrompt,
  tools: PANEL_TOOLS,
});
