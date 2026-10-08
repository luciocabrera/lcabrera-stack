import type { SqlToken } from './privacy.types.ts';

import {
  DIGIT,
  IDENTIFIER_PART,
  IDENTIFIER_START,
  OPERATOR_CHARACTERS,
} from './privacy.constants.ts';
import { quotedEnd } from './quotedEnd.util.ts';
import { runEnd } from './runEnd.util.ts';

type ReadTokenArgs = {
  readonly start: number;
  readonly text: string;
};

export const readToken = ({ start, text }: ReadTokenArgs) => {
  const character = text.charAt(start);

  if (character === "'" || character === '"') {
    const end = quotedEnd({ quote: character, start, text });
    const inner = text
      .slice(start + 1, end - 1)
      .split(character + character)
      .join(character);

    return {
      end,
      token: {
        kind: character === "'" ? 'string' : 'identifier',
        quoted: character === '"',
        value: inner,
      } satisfies SqlToken,
    };
  }

  if (IDENTIFIER_START.test(character)) {
    const end = runEnd({
      matches: (next) => IDENTIFIER_PART.test(next),
      start,
      text,
    });

    return {
      end,
      token: {
        kind: 'identifier',
        quoted: false,
        value: text.slice(start, end).toLowerCase(),
      } satisfies SqlToken,
    };
  }

  if (DIGIT.test(character)) {
    const end = runEnd({ matches: (next) => DIGIT.test(next), start, text });

    return {
      end,
      token: {
        kind: 'number',
        quoted: false,
        value: text.slice(start, end),
      } satisfies SqlToken,
    };
  }

  if (text.startsWith('::', start)) {
    return {
      end: start + 2,
      token: {
        kind: 'punctuation',
        quoted: false,
        value: '::',
      } satisfies SqlToken,
    };
  }

  if (OPERATOR_CHARACTERS.includes(character)) {
    const end = runEnd({
      matches: (next) => OPERATOR_CHARACTERS.includes(next),
      start,
      text,
    });

    return {
      end,
      token: {
        kind: 'operator',
        quoted: false,
        value: text.slice(start, end),
      } satisfies SqlToken,
    };
  }

  return {
    end: start + 1,
    token: {
      kind: 'punctuation',
      quoted: false,
      value: character,
    } satisfies SqlToken,
  };
};
