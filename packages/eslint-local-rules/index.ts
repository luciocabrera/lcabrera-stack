/**
 * Local ESLint plugin - Custom rules
 */

import cleanImportPaths from './clean-import-paths.js';
import destructuringForFunctions from './destructuring-for-functions.js';
import filenameConvention from './filename-convention.js';
import mergeDuplicateImports from './merge-duplicate-imports.js';
import noInlineTypeImports from './no-inline-type-imports.js';
import noTypeDefinitionsInComponents from './no-type-definitions-in-components.js';
import singleComponentExport from './single-component-export.js';
import typeSuffixNaming from './type-suffix-naming.js';

export default {
  rules: {
    'clean-import-paths': cleanImportPaths,
    'destructuring-for-functions': destructuringForFunctions,
    'filename-convention': filenameConvention,
    'merge-duplicate-imports': mergeDuplicateImports,
    'no-inline-type-imports': noInlineTypeImports,
    'no-type-definitions-in-components': noTypeDefinitionsInComponents,
    'single-component-export': singleComponentExport,
    'type-suffix-naming': typeSuffixNaming,
  },
};
