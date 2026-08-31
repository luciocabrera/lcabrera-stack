/*
 * Substituting a consumer's own commands into a shipped file.
 *
 * Why: a skill's procedure travels, but the command that carries out each step
 * does not — `vp run …` is this repository's toolchain and means nothing in a
 * repository built on another. Writing the command literally into a shipped file
 * is the one thing that makes an otherwise portable skill un-portable, so the
 * file carries a placeholder and the consumer's config supplies the command.
 *
 * A file whose placeholders cannot all be resolved is NOT written. Materialising
 * `{{commands.install}}` verbatim would hand a reader an instruction that looks
 * like a command and is not one — worse than reporting that the key is missing.
 */

const PLACEHOLDER = /\{\{[ \t]*commands\.([a-zA-Z][\w-]*)[ \t]*\}\}/g;

export const requiredCommands = (content) => [
  ...new Set([...content.matchAll(PLACEHOLDER)].map((match) => match[1])),
];

/**
 * @param {{ commands: Record<string, string>, content: string }} args
 * @returns {{ content: string, missing: string[] }}
 */
export const substituteCommands = ({ commands, content }) => {
  const missing = requiredCommands(content).filter(
    (name) => typeof commands[name] !== 'string' || commands[name] === '',
  );
  if (missing.length > 0) return { content, missing };
  return {
    content: content.replaceAll(PLACEHOLDER, (_match, name) => commands[name]),
    missing: [],
  };
};
