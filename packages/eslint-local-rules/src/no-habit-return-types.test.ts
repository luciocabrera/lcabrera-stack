import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vite-plus/test';

import rule from './no-habit-return-types.ts';

// RuleTester drives a test framework through these static hooks; wire them to
// vitest's so each case surfaces as a normal test rather than a bare throw.
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

// The valid cases carry the weight here. This rule's design is that it is silent
// wherever a deliberate widening could live, so every annotation it does NOT
// report is the guarantee, not an omission.
ruleTester.run('no-habit-return-types', rule, {
  invalid: [
    {
      code: 'const reset = (): void => { store.clear(); };',
      errors: [{ messageId: 'redundant' }],
      output: 'const reset = () => { store.clear(); };',
    },
    // A guarded throw still leaves a normal completion, so inference says `void`.
    {
      code: 'function guard(a): void { if (!a) { throw new Error("no"); } }',
      errors: [{ messageId: 'redundant' }],
      output: 'function guard(a) { if (!a) { throw new Error("no"); } }',
    },
    {
      code: 'function reset(): void { store.clear(); return; }',
      errors: [{ messageId: 'redundant' }],
      output: 'function reset() { store.clear(); return; }',
    },
    {
      code: 'const save = async (): Promise<void> => { await put(); };',
      errors: [{ messageId: 'redundant' }],
      output: 'const save = async () => { await put(); };',
    },
    {
      code: 'const isOpen = (): boolean => count === 1;',
      errors: [{ messageId: 'redundant' }],
      output: 'const isOpen = () => count === 1;',
    },
    {
      code: 'const has = (): boolean => !!value;',
      errors: [{ messageId: 'redundant' }],
      output: 'const has = () => !!value;',
    },
    {
      code: 'const always = (): boolean => true;',
      errors: [{ messageId: 'redundant' }],
      output: 'const always = () => true;',
    },
    // Every branch has to be boolean, not just the first.
    {
      code: 'function ok(a): boolean { if (a) { return a === 1; } return false; }',
      errors: [{ messageId: 'redundant' }],
      output: 'function ok(a) { if (a) { return a === 1; } return false; }',
    },
    {
      code: 'const Row = (): JSX.Element => <tr />;',
      errors: [{ messageId: 'redundant' }],
      filename: 'file.tsx',
      output: 'const Row = () => <tr />;',
    },
    {
      code: 'const Row = (): React.JSX.Element => <tr />;',
      errors: [{ messageId: 'redundant' }],
      filename: 'file.tsx',
      output: 'const Row = () => <tr />;',
    },
    // A nested function's own returns do not leak into the outer check.
    {
      code: 'const run = (): void => { const inner = () => 1; inner(); };',
      errors: [{ messageId: 'redundant' }],
      output: 'const run = () => { const inner = () => 1; inner(); };',
    },
  ],
  valid: [
    // The whole reason the rule is shaped this way: an annotation that promises
    // callers less than the body returns. Indistinguishable in the text from a
    // habit, so never reported.
    'const makePet = (): Animal => new Dog();',
    'const parse = (): unknown => JSON.parse(raw);',
    'const getName = (): string => user.firstName;',
    // `void` on a concise body DISCARDS a real return value — a widening, and
    // one of the commonest. Only a block body with no returned value is safe.
    'const ignore = (): void => doSomethingReturningAValue();',
    'const later = async (): Promise<void> => queueTheThing();',
    'const value = (): void => { return maybe(); };',
    // `Promise<void>` on a non-async function is not what inference produces.
    'const wait = (): Promise<void> => { start(); };',
    // A body that always throws infers `never`, so `void` is widening it.
    'const fail = (): void => { throw new Error("no"); };',
    'function fail(): void { log(); throw new Error("no"); }',
    'const failAsync = async (): Promise<void> => { throw new Error("no"); };',
    // Wider React types are doing real work and must survive.
    { code: 'const Row = (): React.ReactNode => <tr />;', filename: 'f.tsx' },
    { code: 'const Row = (): ReactElement => <tr />;', filename: 'f.tsx' },
    {
      code: 'const Row = (): JSX.Element | null => <tr />;',
      filename: 'f.tsx',
    },
    // Not every branch is boolean, so `boolean` may be widening a union.
    'function pick(a): boolean { if (a) { return a; } return false; }',
    'const test = (): boolean => a && b;',
    // A function that names itself: TypeScript can fail to infer a recursive
    // return type, so the annotation may be load-bearing.
    'function walk(n): void { if (n) { walk(n.next); } }',
    'const walk = (n): void => { if (n) { walk(n.next); } };',
    // An overload signature has no body to infer from.
    'declare function f(a: string): boolean;',
    // Nothing to report when nothing is annotated.
    'const reset = () => { store.clear(); };',
  ],
});
