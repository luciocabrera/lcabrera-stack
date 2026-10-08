import type { SqlToken } from './privacy.types.ts';

import { WHITESPACE } from './privacy.constants.ts';
import { readToken } from './readToken.util.ts';
import { runEnd } from './runEnd.util.ts';

export const sqlTokens = (text: string) => {
  const tokens: SqlToken[] = [];
  let index = runEnd({
    matches: (next) => WHITESPACE.test(next),
    start: 0,
    text,
  });

  while (index < text.length) {
    const { end, token } = readToken({ start: index, text });

    tokens.push(token);
    index = runEnd({
      matches: (next) => WHITESPACE.test(next),
      start: end,
      text,
    });
  }

  return tokens;
};
