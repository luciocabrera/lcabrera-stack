import * as stylex from '@stylexjs/stylex';
import { describe, expect, it } from 'vite-plus/test';

import { compileStylexRules } from '#ui/utils/tests/compileStylexRules.util';
import { readStylexDeclaration } from '#ui/utils/tests/readStylexDeclaration.util';

import { styles } from './Breadcrumbs.stylex';

const SOURCES = import.meta.glob<string>('./Breadcrumbs.stylex.ts', {
  eager: true,
  import: 'default',
  query: '?raw',
});

const rules = await compileStylexRules([
  {
    path: 'components/Breadcrumbs/Breadcrumbs.stylex.ts',
    source: SOURCES['./Breadcrumbs.stylex.ts'] ?? '',
  },
]);

type ReadArgs = {
  readonly className: string | undefined;
  readonly property: string;
  readonly pseudo?: string;
};

const read = ({ className, property, pseudo }: ReadArgs) =>
  readStylexDeclaration({ className, property, pseudo, rules });

const linkClassName = stylex.props(styles.link).className;

describe('the compiled breadcrumb styles', () => {
  it('compiles the Breadcrumbs style module', () => {
    expect(rules.length).toBeGreaterThan(0);
  });

  it('underlines a breadcrumb link at rest and thickens the underline on hover and focus', () => {
    expect(
      read({ className: linkClassName, property: 'text-decoration-line' }),
    ).toBe('underline');
    expect(
      read({ className: linkClassName, property: 'text-decoration-thickness' }),
    ).toBe('1px');
    expect(
      read({
        className: linkClassName,
        property: 'text-decoration-thickness',
        pseudo: ':hover',
      }),
    ).toBe('2px');
    expect(
      read({
        className: linkClassName,
        property: 'text-decoration-thickness',
        pseudo: ':focus-visible',
      }),
    ).toBe('2px');
  });

  it('leaves a label-only step and the current page without an underline', () => {
    for (const style of [styles.item, styles.current]) {
      expect(
        read({
          className: stylex.props(style).className,
          property: 'text-decoration-line',
        }),
      ).toBeUndefined();
    }
  });
});
