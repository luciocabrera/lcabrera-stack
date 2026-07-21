/**
 * The rule registry, kept separate from `index.ts` so it can be imported from
 * source.
 *
 * `index.js` is a runtime forwarder to `build/index.js`, so anything importing
 * `./index.js` needs the plugin compiled first. Tests must not: CI runs the
 * suites without building this package, and `rules-have-tests.test.ts` needs the
 * registry. Every other specifier here resolves to TypeScript because no
 * same-named `.js` exists beside it — this file restores that property for the
 * registry too.
 */

import cleanImportPaths from './clean-import-paths.js';
import destructuringForFunctions from './destructuring-for-functions.js';
import filenameConvention from './filename-convention.js';
import mergeDuplicateImports from './merge-duplicate-imports.js';
import noInlineTypeImports from './no-inline-type-imports.js';
import noTypeDefinitionsInComponents from './no-type-definitions-in-components.js';
import readonlyProps from './readonly-props.js';
import singleComponentExport from './single-component-export.js';
import typeSuffixNaming from './type-suffix-naming.js';

export const rules = {
  'clean-import-paths': cleanImportPaths,
  'destructuring-for-functions': destructuringForFunctions,
  'filename-convention': filenameConvention,
  'merge-duplicate-imports': mergeDuplicateImports,
  'no-inline-type-imports': noInlineTypeImports,
  'no-type-definitions-in-components': noTypeDefinitionsInComponents,
  'readonly-props': readonlyProps,
  'single-component-export': singleComponentExport,
  'type-suffix-naming': typeSuffixNaming,
};
