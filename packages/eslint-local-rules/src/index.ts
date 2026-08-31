/**
 * The plugin entry point: the rule registry, and the plugin object ESLint loads.
 *
 * `rules` is exported by name as well as through the default plugin object
 * because `rules-have-tests.test.ts` asserts every registered rule has a suite,
 * and a consumer assembling their own plugin object may want the raw registry.
 *
 * `meta.version` is deliberately absent. ESLint treats it as optional, and the
 * only honest source for it is package.json — importing that at runtime would
 * pull the manifest into the bundle, and hand-copying it would be a number
 * nothing keeps in step with the real one.
 */

import cleanImportPaths from './clean-import-paths.ts';
import destructuringForFunctions from './destructuring-for-functions.ts';
import domainFolderFilename from './domain-folder-filename.ts';
import filenameConvention from './filename-convention.ts';
import mergeDuplicateImports from './merge-duplicate-imports.ts';
import noExplanatoryComments from './no-explanatory-comments.ts';
import noHabitReturnTypes from './no-habit-return-types.ts';
import noInlineTypeImports from './no-inline-type-imports.ts';
import noTypeDefinitionsInComponents from './no-type-definitions-in-components.ts';
import readonlyProps from './readonly-props.ts';
import singleComponentExport from './single-component-export.ts';
import typeSuffixNaming from './type-suffix-naming.ts';

export const rules = {
  'clean-import-paths': cleanImportPaths,
  'destructuring-for-functions': destructuringForFunctions,
  'domain-folder-filename': domainFolderFilename,
  'filename-convention': filenameConvention,
  'merge-duplicate-imports': mergeDuplicateImports,
  'no-explanatory-comments': noExplanatoryComments,
  'no-habit-return-types': noHabitReturnTypes,
  'no-inline-type-imports': noInlineTypeImports,
  'no-type-definitions-in-components': noTypeDefinitionsInComponents,
  'readonly-props': readonlyProps,
  'single-component-export': singleComponentExport,
  'type-suffix-naming': typeSuffixNaming,
};

export default {
  meta: { name: '@lcabrera/eslint-plugin' },
  rules,
};
