import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';

import rule from './destructuring-for-functions.js';

// RuleTester drives a test framework through these static hooks; wire them to
// vitest's so each case surfaces as a normal test rather than a bare throw.
// (@typescript-eslint/rule-tester defaults the TypeScript parser, which the
// type-annotation fixtures below need — espree cannot read any of them.)
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run('destructuring-for-functions', rule, {
  invalid: [
    {
      code: 'const add = (a: number, b: number) => a + b;',
      errors: [{ messageId: 'useObjectParam' }],
    },
    {
      code: 'function add(a: number, b: number) { return a + b; }',
      errors: [{ messageId: 'useObjectParam' }],
    },
    {
      code: 'const obj = { add: function (a: number, b: number) { return a + b; } };',
      errors: [{ messageId: 'useObjectParam' }],
    },

    // A plain call is NOT exempt just because the function is an argument —
    // only the specific fixed-signature shapes are. Guarding this stops the
    // exemptions from quietly swallowing ordinary violations.
    {
      code: 'run((a: number, b: number) => a + b);',
      errors: [{ messageId: 'useObjectParam' }],
    },
    {
      code: 'app.use((request: Req, response: Res) => undefined);',
      errors: [{ messageId: 'useObjectParam' }],
    },

    // `new Whatever` is not `new Promise`, and a Promise executor is only
    // exempt in the executor position.
    {
      code: 'new Deferred((resolve: Fn, reject: Fn) => undefined);',
      errors: [{ messageId: 'useObjectParam' }],
    },
    {
      code: 'new Promise(onFulfilled, (a: number, b: number) => a + b);',
      errors: [{ messageId: 'useObjectParam' }],
    },

    // An annotation on the VALUE does not fix an inner function's signature —
    // only an annotation the function itself is conforming to.
    {
      code: 'const make = () => (a: number, b: number) => a + b;',
      errors: [{ messageId: 'useObjectParam' }],
    },
  ],
  valid: [
    // Nothing to object to.
    'const identity = (value: number) => value;',
    'const noop = () => undefined;',
    'const add = ({ a, b }: { a: number; b: number }) => a + b;',

    // Array-method callbacks: positional by contract.
    'items.map((item: number, index: number) => item + index);',
    'items.reduce((total: number, item: number) => total + item, 0);',
    'items.sort((a: number, b: number) => a - b);',
    '[...items].toSorted((a: number, b: number) => a - b);',
    'Array.from({ length: 3 }, (_value: unknown, index: number) => index);',

    // Promise executor: invoked by the language with two positional arguments.
    'new Promise((resolve: Fn, reject: Fn) => resolve(undefined));',
    'new Promise<void>((resolve: Fn, reject: Fn) => resolve());',

    // Declared as a framework handler type — the annotation fixes the shape.
    'const handler: RequestHandler = (request: Req, response: Res, next: Next) => undefined;',
    'const onError: ErrorRequestHandler = (error: Error, request: Req, response: Res, next: Next) => undefined;',

    // Returned from a function that declares the handler type as its return
    // type — the same constraint, one level in.
    'const create = (): RequestHandler => (request: Req, response: Res, next: Next) => undefined;',
  ],
});
