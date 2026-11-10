import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, expect, it } from 'vite-plus/test';

import rule from './no-raw-ui-primitives.ts';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
});

const BANNED = [
  'table',
  'select',
  'button',
  'input',
  'textarea',
  'h1',
  'h2',
  'h3',
] as const;

const REPORTED_INPUTS = [
  "const View = () => <input name='q' type='text' />;",
  "const View = () => <input name='q' />;",
  "const View = ({ kind }) => <input name='q' type={kind} />;",
  "const View = () => <input name='q' type={'hidden'} />;",
  'const View = () => <input name=\'q\' type="hidden" type="text" />;',
  "const View = ({ rest }) => <input name='q' type='hidden' {...rest} />;",
  "const View = () => <input name='q' type='Hidden' />;",
  "const View = () => <input name='q' type />;",
];

const reported = (element: string) => ({
  data: { element },
  messageId: 'rawUiPrimitive' as const,
});

ruleTester.run('no-raw-ui-primitives', rule, {
  invalid: [
    ...BANNED.map((element) => ({
      code: `const View = () => <${element} />;`,
      errors: [reported(element)],
    })),
    ...BANNED.map((element) => ({
      code: `const View = () => <section><${element} id='x'>text</${element}></section>;`,
      errors: [reported(element)],
    })),
    {
      code: 'const View = () => <table><tbody><tr><td><button>Go</button></td></tr></tbody></table>;',
      errors: [reported('table'), reported('button')],
    },
    ...REPORTED_INPUTS.map((code) => ({
      code,
      errors: [reported('input')],
    })),
    {
      code: "const View = () => <h2 data-type='hidden'>Title</h2>;",
      errors: [reported('h2')],
    },
    {
      code: 'const View = () => <table />;',
      errors: [reported('table')],
      filename: 'src/routes/home/Home.component.tsx',
    },
  ],
  valid: [
    "const Grid = ({ rows }) => <Table rows={rows} density='compact' />;",
    "const Save = () => <Button type='submit'>Save</Button>;",
    'const Heading = () => <Title level={1}>Overview</Title>;',
    "const Pick = () => <Select name='a' options={[]} />;",
    "const Query = () => <TextInput name='q' />;",
    'const Fancy = () => <motion.button />;',
    'const Svg = () => <svg:h1 />;',
    'const View = () => <section><p>text</p><h4>Minor</h4><label>L</label></section>;',
    "const View = () => <input name='redirectTo' type='hidden' value={to} />;",
    'const View = () => <input type="hidden" name="token" />;',
    "const View = ({ rest }) => <input {...rest} type='hidden' />;",
    "const View = () => <input type='text' type='hidden' />;",
    {
      code: 'const View = () => <DataTable />;',
      filename: 'src/routes/home/Home.component.tsx',
    },
  ],
});

describe('no-raw-ui-primitives meta', () => {
  it('is a suggestion that names the element and the component library', () => {
    expect(rule.meta.type).toBe('suggestion');
    expect(rule.meta.messages.rawUiPrimitive).toBe(
      'Render `<{{element}}>` through the component library rather than as a raw intrinsic element.',
    );
    expect(rule.meta.docs?.description).toBe(
      'Disallow raw table, form-control and heading elements in favour of the component library',
    );
  });
});
