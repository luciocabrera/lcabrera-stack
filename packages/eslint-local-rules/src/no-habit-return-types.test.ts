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
    // A guard clause: the `if` can be skipped, so the bottom is reachable and
    // inference really does say `void`. Reported again now that the check asks
    // about reachability rather than about the presence of a `throw`.
    {
      code: 'function guard(a): void { if (!a) { throw new Error("no"); } }',
      errors: [{ messageId: 'redundant' }],
      output: 'function guard(a) { if (!a) { throw new Error("no"); } }',
    },
    // A `break` finishes the loop, so this one is not endless.
    {
      code: 'const loop = (): void => { while (true) { if (x) { break; } } };',
      errors: [{ messageId: 'redundant' }],
      output: 'const loop = () => { while (true) { if (x) { break; } } };',
    },
    // The body cannot finish but the handler can, so the bottom is reachable.
    {
      code: 'const caught = (): void => { try { throw p; } catch { handle(); } };',
      errors: [{ messageId: 'redundant' }],
      output: 'const caught = () => { try { throw p; } catch { handle(); } };',
    },
    // No `default`, so every case can be skipped.
    {
      code: 'const picked = (): void => { switch (x) { case 1: throw p; } };',
      errors: [{ messageId: 'redundant' }],
      output: 'const picked = () => { switch (x) { case 1: throw p; } };',
    },
    // KNOWN LIMITATION, pinned so it cannot be lost. `process.exit` is declared
    // `(): never`, so the bottom is unreachable and inference says `never` — but
    // knowing that means resolving the callee's signature, and this plugin has
    // no type checker. Delete this case when a type-aware version closes it.
    {
      code: 'const die = (): void => { process.exit(1); };',
      errors: [{ messageId: 'redundant' }],
      output: 'const die = () => { process.exit(1); };',
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
    // Nor does its throw: `run`'s own end point is still reachable, so `void` is
    // what inference produces. This is what the nested-function prune buys.
    {
      code: 'const run = (): void => { const inner = () => { throw p; }; inner(); };',
      errors: [{ messageId: 'redundant' }],
      output:
        'const run = () => { const inner = () => { throw p; }; inner(); };',
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
    // A body whose end point cannot be reached infers `never`, so `void` is
    // widening it. None of the four below puts a `throw` among the block's
    // direct children, which is why the check walks the body instead.
    'const fail = (): void => { throw new Error("no"); };',
    'function fail(): void { log(); throw new Error("no"); }',
    'const failAsync = async (): Promise<void> => { throw new Error("no"); };',
    'const both = (): void => { if (x) { throw p; } else { throw q; } };',
    'const cased = (): void => { switch (x) { default: throw p; } };',
    'const cleanup = (): void => { try { go(); } finally { throw p; } };',
    'const forever = (): void => { for (;;) { tick(); } };',
    'const spin = (): void => { while (true) { tick(); } };',
    // All four spellings, because the compiler's test is syntactic and treats
    // them alike — a check that knew only two of them still auto-narrowed these.
    'const tested = (): void => { for (;true;) { tick(); } };',
    'const once = (): void => { do { tick(); } while (true); };',
    // The inner `break` belongs to the inner loop, so the outer one is still
    // endless. Counting it would report an annotation that is widening `never`.
    'const nested = (): void => { while (true) { while (x) { break; } } };',
    // Unreachable after the first statement, so the bottom is never reached.
    'function fell(): void { throw p; log(); }',
    // Wider React types are doing real work and must survive.
    { code: 'const Row = (): React.ReactNode => <tr />;', filename: 'f.tsx' },
    { code: 'const Row = (): ReactElement => <tr />;', filename: 'f.tsx' },
    {
      code: 'const Row = (): JSX.Element | null => <tr />;',
      filename: 'f.tsx',
    },
    // Not every branch is boolean, so `boolean` may be widening a union.
    'function pick(a): boolean { if (a) { return a; } return false; }',
    // Every RETURN is boolean, but the bottom is reachable — so inference says
    // `boolean | undefined` and dropping the annotation widens the contract.
    // The annotated form is a TS2366, and `vp run lint` chains `eslint --fix`,
    // so reporting it would clear a type error by widening rather than by
    // adding the missing return.
    'function f(a): boolean { if (a) { return true; } }',
    // The same hole with a statement in front of it: a bare `return;` returns
    // `undefined` on that path.
    'function g(a): boolean { if (a) { return true; } return; }',
    {
      code: 'function C(a): JSX.Element { if (a) { return <a />; } }',
      filename: 'f.tsx',
    },
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
