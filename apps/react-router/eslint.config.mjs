import { createCustomRulesLintConfig } from '@repo/vite-configs/eslint-custom-rules';

export default createCustomRulesLintConfig({
  ignorePatterns: [
    'src/components/AppNavigation/AppNavigation.component.tsx',
    'src/components/Tooltip/Tooltip.stylex.ts',
    'src/features/showcase/ShowcasePage/ShowcasePage.component.tsx',
  ],
});
