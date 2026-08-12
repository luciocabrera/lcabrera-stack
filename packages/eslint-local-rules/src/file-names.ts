// The one definition of the `<base>.<suffix>.<ext>` filename shape, shared by
// every rule that keys off it.
//
// It lives here for the same reason `COMPONENT_FILE_SUFFIXES` does: two rules
// now decide what to check from the same parse, and a rule that parses
// filenames slightly differently from its neighbour goes quiet rather than
// wrong — a suffix it stops recognising reports exactly the clean pass that
// compliant code does.

/**
 * Split a filename into its `{ name, suffix }`, or `undefined` when the file
 * has no recognised `<name>.<suffix>.<ext>` shape. A trailing `.test`/`.spec`
 * segment is stripped first so a test file is checked against the subject it
 * covers (`editOrder.action.test.ts` → name `editOrder`, suffix `action`).
 */
export const parseFileName = (filename: string) => {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  const withoutExt = base.replace(/\.(?:tsx?|jsx?|mjs|cjs)$/, '');
  const withoutTest = withoutExt.replace(/\.(?:test|spec)$/, '');
  const lastDot = withoutTest.lastIndexOf('.');
  if (lastDot <= 0) {
    return;
  }
  return {
    name: withoutTest.slice(0, lastDot),
    suffix: withoutTest.slice(lastDot + 1),
  };
};
