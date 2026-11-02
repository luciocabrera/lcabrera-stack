import type { CompiledStylexRule } from './tests.types';

import { parseStylexRule } from './parseStylexRule.util';

const RULE_MARKER = 'ltr: "';

export const readStylexRules = (code: string) =>
  code
    .split(RULE_MARKER)
    .slice(1)
    .map((chunk) => parseStylexRule(chunk.slice(0, chunk.indexOf('"'))))
    .filter((rule): rule is CompiledStylexRule => rule !== undefined);
