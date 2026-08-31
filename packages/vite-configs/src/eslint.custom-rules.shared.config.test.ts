import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import { createBaseCustomRulesLintConfig } from './eslint.base-custom-rules.shared.config.mjs';
import { createCustomRulesLintConfig } from './eslint.custom-rules.shared.config.mjs';

const UI_WORKSPACE = fileURLToPath(new URL('../../ui', import.meta.url));

type FlatConfigBlock = {
  readonly files?: readonly string[];
  readonly rules?: Readonly<Record<string, unknown>>;
};

type SeverityOfArgs = {
  readonly blocks: readonly FlatConfigBlock[];
  readonly rule: string;
};

const severityOf = ({ blocks, rule }: SeverityOfArgs) =>
  blocks.flatMap((block) => {
    const severity = block.rules?.[rule];
    return severity === undefined ? [] : [severity];
  });

const FACTORIES = [
  ['react', createCustomRulesLintConfig],
  ['base', createBaseCustomRulesLintConfig],
] as const;

describe('the shared flat configs carry the local rules a consumer inherits', () => {
  for (const [name, factory] of FACTORIES) {
    it(`turns no-explanatory-comments on as an error in the ${name} factory`, async () => {
      const blocks = (await factory({
        tsconfigRootDir: UI_WORKSPACE,
      })) as readonly FlatConfigBlock[];
      const severities = severityOf({
        blocks,
        rule: 'local-rules/no-explanatory-comments',
      });

      expect(severities.length).toBeGreaterThan(0);
      expect(severities.every((severity) => severity === 'error')).toBe(true);
    });

    it(`registers the local-rules plugin on every block that sets the rule in the ${name} factory`, async () => {
      const blocks = (await factory({
        tsconfigRootDir: UI_WORKSPACE,
      })) as readonly (FlatConfigBlock & {
        readonly plugins?: Readonly<Record<string, unknown>>;
      })[];
      const owning = blocks.filter(
        (block) =>
          block.rules?.['local-rules/no-explanatory-comments'] !== undefined,
      );

      expect(
        owning.every((block) => block.plugins?.['local-rules'] !== undefined),
      ).toBe(true);
    });

    it(`covers both the TypeScript and the JavaScript sources in the ${name} factory`, async () => {
      const blocks = (await factory({
        tsconfigRootDir: UI_WORKSPACE,
      })) as readonly FlatConfigBlock[];
      const globs = blocks.flatMap((block) =>
        block.rules?.['local-rules/no-explanatory-comments'] === undefined
          ? []
          : [...(block.files ?? [])],
      );

      expect(globs.some((glob) => glob.endsWith('*.tsx'))).toBe(true);
      expect(globs.some((glob) => glob.endsWith('*.mjs'))).toBe(true);
    });
  }
});
