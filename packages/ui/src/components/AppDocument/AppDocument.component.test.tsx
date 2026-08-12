import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('#ui/components/DevStyleXInject', () => ({
  DevStyleXInject: ({ cssHref }: { readonly cssHref: string }) => (
    <link data-testid='stylex-css' href={cssHref} rel='stylesheet' />
  ),
}));

// Meta/Links/Scripts/ScrollRestoration all read React Router's internal
// framework context and throw ("You must render this element inside a
// <HydratedRouter> element") outside a real router — mocked here the same
// way this codebase already mocks <Outlet> when testing components that use
// it outside a live router (see Root.component.test.tsx/AppShell's test).
vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router');

  return {
    ...actual,
    Links: () => <link data-testid='links' rel='stylesheet' />,
    Meta: () => <meta data-testid='meta' />,
    Scripts: ({ nonce }: { readonly nonce?: string }) => (
      <script data-nonce={nonce} data-testid='scripts' />
    ),
    ScrollRestoration: ({ nonce }: { readonly nonce?: string }) => (
      <script data-nonce={nonce} data-testid='scroll-restoration' />
    ),
  };
});

import { AppDocument } from './AppDocument.component';

// Rendered via renderToStaticMarkup rather than @testing-library/react's
// render(): this component's root is <html>, which isn't valid to mount
// inside the container div render() appends to document.body.
describe('AppDocument', () => {
  it('renders children inside the body', () => {
    const html = renderToStaticMarkup(
      <AppDocument stylexCssHref='/stylex.css'>
        <div id='app-root'>App content</div>
      </AppDocument>,
    );

    expect(html).toContain('<div id="app-root">App content</div>');
  });

  it('passes stylexCssHref through to DevStyleXInject', () => {
    const html = renderToStaticMarkup(
      <AppDocument stylexCssHref='/dist/stylex-abc123.css'>
        <div />
      </AppDocument>,
    );

    expect(html).toContain('href="/dist/stylex-abc123.css"');
  });

  it('omits the csp-nonce meta tag when rootData has no cspNonce', () => {
    const html = renderToStaticMarkup(
      <AppDocument stylexCssHref='/stylex.css'>
        <div />
      </AppDocument>,
    );

    expect(html).not.toContain('csp-nonce');
  });

  it('renders the csp-nonce meta tag and threads the nonce to Scripts/ScrollRestoration when rootData has a cspNonce', () => {
    const html = renderToStaticMarkup(
      <AppDocument
        rootData={{ cspNonce: 'nonce-123' }}
        stylexCssHref='/stylex.css'
      >
        <div />
      </AppDocument>,
    );

    expect(html).toContain('property="csp-nonce"');
    expect(html.match(/data-nonce="nonce-123"/g)?.length).toBe(2);
  });
});
