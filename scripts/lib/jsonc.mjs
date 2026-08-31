/**
 * A JSONC reader shared by the gates that read a commented config.
 *
 * Extracted from `verify-suppressions.mjs` when a second gate needed it. It is
 * one function with a subtle correctness requirement, and two copies of that
 * subtlety is one copy too many — the string-awareness below is exactly the
 * part a re-implementation gets wrong.
 *
 * Both configs this reads (`biome.jsonc`, `doctor.config.jsonc`) belong to
 * tools that fail SILENTLY on a malformed config and fall back to defaults —
 * measured for React Doctor, documented for Biome in AGENTS.md §4. A parse
 * error here is therefore a real finding about the repo, not a nuisance: it is
 * the only signal that a config everyone believes is in force is being ignored.
 */

/**
 * Index just past the string literal opening at `start`.
 *
 * Skips the character after a backslash so an escaped quote does not end the
 * literal early — which would put the scanner back in "code" mode mid-string
 * and let the rest of the line be read as syntax.
 */
const endOfString = (text, start) => {
  for (let index = start + 1; index < text.length; index += 1) {
    if (text[index] === '\\') index += 1;
    else if (text[index] === '"') return index + 1;
  }
  return text.length;
};

const endOfLineComment = (text, start) => {
  const newline = text.indexOf('\n', start);
  return newline === -1 ? text.length : newline;
};

export const stripJsoncComments = (text) => {
  let out = '';
  let index = 0;
  while (index < text.length) {
    if (text[index] === '"') {
      const end = endOfString(text, index);
      out += text.slice(index, end);
      index = end;
    } else if (text[index] === '/' && text[index + 1] === '/') {
      index = endOfLineComment(text, index);
    } else {
      out += text[index];
      index += 1;
    }
  }
  return out;
};

export const parseJsonc = (text) =>
  JSON.parse(stripJsoncComments(text).replaceAll(/,(?=\s*[}\]])/gu, ''));
