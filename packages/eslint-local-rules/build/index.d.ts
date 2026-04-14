/**
 * Local ESLint plugin - Custom rules
 */
declare const _default: {
    rules: {
        'destructuring-for-functions': import("eslint").Rule.RuleModule;
        'merge-duplicate-imports': import("eslint").Rule.RuleModule;
        'no-inline-type-imports': import("eslint").Rule.RuleModule;
        'no-type-definitions-in-components': import("@typescript-eslint/utils/ts-eslint").RuleModule<"noTypeInComponent", [], unknown, import("@typescript-eslint/utils/ts-eslint").RuleListener> & {
            name: string;
        };
        'single-component-export': import("@typescript-eslint/utils/ts-eslint").RuleModule<"multipleComponentExports", [], unknown, import("@typescript-eslint/utils/ts-eslint").RuleListener> & {
            name: string;
        };
        'type-suffix-naming': import("eslint").Rule.RuleModule;
    };
};
export default _default;
