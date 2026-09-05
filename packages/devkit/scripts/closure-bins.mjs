/*
 * The executables a shipped file invokes out of the install directory — the
 * `node_modules` bin folder — whether it names the path outright or binds it to
 * a variable first.
 *
 * A hook and a workflow step both reach a gate that way, and neither is markdown,
 * so nothing else in this package can see the name they depend on.
 *
 * `BIN_DIRECTORY` consumes the character before the name, so no scan restarts
 * inside a name it has already read. `closure-extract.mjs` records why.
 */

const BIN_PATH = /node_modules\/\.bin\/([\w.-]+)/g;

const BIN_DIRECTORY =
  /(?:^|\W)([A-Za-z_]\w*)[ \t]*[:=][ \t]*["']?\.{0,2}\/?node_modules\/\.bin["']?[ \t]*$/;

const VARIABLE_REFERENCE = /\$\{?([A-Za-z_]\w*)\}?\/([\w.-]+)/g;

const bindingIn = (line) => {
  const bound = BIN_DIRECTORY.exec(line.split('#')[0] ?? '')?.[1];
  return bound === undefined ? [] : [bound];
};

/**
 * @param {string} content
 * @returns {{ line: number, name: string }[]}
 */
export const extractBinInvocations = (content) => {
  const lines = content.split('\n');
  const directories = new Set(lines.flatMap(bindingIn));

  const named = lines.flatMap((line, index) =>
    [...line.matchAll(BIN_PATH)].map((match) => ({
      line: index + 1,
      name: match[1],
    })),
  );

  const bound = lines.flatMap((line, index) =>
    [...line.matchAll(VARIABLE_REFERENCE)]
      .filter((match) => directories.has(match[1]))
      .map((match) => ({ line: index + 1, name: match[2] })),
  );

  return [...named, ...bound];
};
