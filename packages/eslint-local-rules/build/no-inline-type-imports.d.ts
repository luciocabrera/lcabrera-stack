/**
 * Custom ESLint rule to enforce separate type imports
 * Disallows: import { type X } from 'module'
 * Enforces: import type { X } from 'module'
 */
import type { Rule } from 'eslint';
declare const rule: Rule.RuleModule;
export default rule;
