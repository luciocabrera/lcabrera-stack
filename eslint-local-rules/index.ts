/**
 * Local ESLint plugin - Custom rules
 */

import destructuringForFunctions from './destructuring-for-functions.js';
import mergeDuplicateImports from './merge-duplicate-imports.js';
import noInlineTypeImports from './no-inline-type-imports.js';
import typeSuffixNaming from './type-suffix-naming.js';

export default {
  rules: {
    'destructuring-for-functions': destructuringForFunctions,
    'merge-duplicate-imports': mergeDuplicateImports,
    'no-inline-type-imports': noInlineTypeImports,
    'type-suffix-naming': typeSuffixNaming,
  },
};
