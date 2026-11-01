/**
 * Reads the declaration a rendered class sets for one property, from rules `compileStylexRules` listed.
 */

import type { CompiledStylexRule } from './compileStylexRules.util';

type ReadStylexDeclarationArgs = {
  readonly className: string | undefined;
  readonly property: string;
  readonly pseudo?: string;
  readonly rules: readonly CompiledStylexRule[];
};

export const readStylexDeclaration = ({
  className = '',
  property,
  pseudo = '',
  rules,
}: ReadStylexDeclarationArgs) => {
  const classNames = new Set(className.split(' '));

  return rules.find(
    (rule) =>
      classNames.has(rule.className) &&
      rule.property === property &&
      rule.pseudo === pseudo,
  )?.value;
};
