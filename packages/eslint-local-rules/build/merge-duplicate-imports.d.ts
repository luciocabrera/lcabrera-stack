/**
 * Custom ESLint rule to merge duplicate imports from the same source
 * Enforces: import { A, B } from './module'
 * Disallows: import { A } from './module'; import { B } from './module'
 */
import type { Rule } from 'eslint';
declare const rule: Rule.RuleModule;
export default rule;
