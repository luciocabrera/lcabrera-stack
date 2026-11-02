export const parseStylexRule = (css: string) => {
  const open = css.indexOf('{');

  if (
    open === -1 ||
    !css.startsWith('.x') ||
    !css.endsWith('}') ||
    css.includes('{', open + 1)
  ) {
    return;
  }

  const body = css.slice(open + 1, -1);
  const colon = body.indexOf(':');

  if (colon === -1) return;

  const selector = css.slice(1, open);
  const pseudoStart = selector.indexOf(':');

  return {
    className: pseudoStart === -1 ? selector : selector.slice(0, pseudoStart),
    property: body.slice(0, colon),
    pseudo: pseudoStart === -1 ? '' : selector.slice(pseudoStart),
    value: body.slice(colon + 1),
  };
};
