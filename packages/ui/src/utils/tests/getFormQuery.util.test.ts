// @vitest-environment jsdom

import { describe, expect, it } from 'vite-plus/test';

import { getFormQuery } from './getFormQuery.util';

const formWith = (html: string) => {
  const form = document.createElement('form');

  form.innerHTML = html;

  return form;
};

describe('getFormQuery', () => {
  it('encodes every named entry in document order', () => {
    expect(
      getFormQuery(
        formWith(
          "<input name='a' value='one'><input name='b' value='two words'><input name='a' value='three'>",
        ),
      ),
    ).toBe('a=one&b=two+words&a=three');
  });

  it('leaves out a control with no name', () => {
    expect(
      getFormQuery(
        formWith("<input value='lost'><input name='kept' value='x'>"),
      ),
    ).toBe('kept=x');
  });

  it('submits a file control by its file name, empty when none is chosen', () => {
    expect(getFormQuery(formWith("<input name='upload' type='file'>"))).toBe(
      'upload=',
    );
  });
});
