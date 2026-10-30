// @vitest-environment jsdom

import { cleanup } from '@testing-library/react';
import { useSyncExternalStore } from 'react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { expectServerMarkupMatchesClient } from './expectServerMarkupMatchesClient.util';

afterEach(cleanup);

const unsubscribe = () => undefined;

const subscribe = () => unsubscribe;

const RuntimeLabel = () => (
  <span>
    {useSyncExternalStore(
      subscribe,
      () => 'client',
      () => 'server',
    )}
  </span>
);

describe('expectServerMarkupMatchesClient', () => {
  it('passes a tree that renders the same markup on both sides', () => {
    expectServerMarkupMatchesClient(
      <p className='same' id='shared'>
        Same
      </p>,
    );
  });

  it('fails a tree whose server markup differs from the client render', () => {
    expect(() => {
      expectServerMarkupMatchesClient(<RuntimeLabel />);
    }).toThrow(/expected false to be true/);
  });

  it('fails a tree that does not render exactly one root node', () => {
    expect(() => {
      expectServerMarkupMatchesClient(
        <>
          <span>One</span>
          <span>Two</span>
        </>,
      );
    }).toThrow(/length of 1/);
  });
});
