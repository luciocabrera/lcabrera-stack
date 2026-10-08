import type { SqlToken } from './privacy.types.ts';

import { CLAUSE_KEYWORDS } from './privacy.constants.ts';

export const isClauseEnd = (token: SqlToken | undefined) =>
  token === undefined ||
  (token.kind === 'punctuation' && [')', ',', ';'].includes(token.value)) ||
  (token.kind === 'identifier' &&
    !token.quoted &&
    CLAUSE_KEYWORDS.has(token.value));
