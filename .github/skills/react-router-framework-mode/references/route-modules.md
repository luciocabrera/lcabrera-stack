---
title: Route Modules
description: All route module exports - loader, action, meta, links, ErrorBoundary, etc.
tags:
  [route-module, loader, action, meta, links, ErrorBoundary, headers, handle]
---

# Route Modules

## Overview

Route modules are files referenced in `routes.ts` that define automatic code-splitting, data loading, actions, revalidation, error boundaries, and more. For routing configuration, see [routing.md](./routing.md).

## Exports Quick Reference

| Export             | Purpose                             | Runs On |
| ------------------ | ----------------------------------- | ------- |
| `default`          | Route component                     | Client  |
| `loader`           | Load data before render             | Server  |
| `clientLoader`     | Load data on client                 | Client  |
| `action`           | Handle form mutations               | Server  |
| `clientAction`     | Handle mutations on client          | Client  |
| `middleware`       | Pre/post request processing         | Server  |
| `clientMiddleware` | Client navigation processing        | Client  |
| `ErrorBoundary`    | Render on errors                    | Client  |
| `HydrateFallback`  | Show during client loader hydration | Client  |
| `headers`          | Set HTTP response headers           | Server  |
| `handle`           | Custom route metadata               | Both    |
| `links`            | Add `<link>` elements               | Both    |
| `meta`             | Add meta tags                       | Both    |
| `shouldRevalidate` | Control loader revalidation         | Client  |

---

## Component (`default`)

The default export renders when the route matches:

```tsx
import type { Route } from './+types/my-route';

export const MyComponent = ({
  loaderData,
  actionData,
  params,
  matches,
}: Route.ComponentProps) => {
  return <div>{loaderData.message}</div>;
};
```

**Props available:**

- `loaderData` - Data from `loader`
- `actionData` - Data from `action`
- `params` - Route parameters
- `matches` - All matches in current route tree

---

## `loader`

Loads data on the server before render:

```tsx
export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const data = await db.find(params.id);
  if (!data) {
    throw new Response('Not Found', { status: 404 });
  }
  return data;
};
```

**Args:** `{ params, request, context }`

---

## `clientLoader`

Runs in browser. Can augment or replace server loader:

```tsx
export const clientLoader = async ({
  params,
  serverLoader,
}: Route.ClientLoaderArgs) => {
  const serverData = await serverLoader();
  const clientData = await getClientData();
  return { ...serverData, ...clientData };
};

// Run during initial hydration
clientLoader.hydrate = true as const;
```

**Args:** `{ params, request, serverLoader }`

**Use `clientLoader.hydrate = true` when:**

- Client loader should run during initial page load
- Need to augment server data with client-only data

---

## `action`

Handles form submissions with automatic revalidation:

```tsx
import { Form, redirect } from 'react-router';

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  await db.create({ title: formData.get('title') });
  return redirect('/list');
};

export const MyComponent = () => {
  return (
    <Form method='post'>
      <input name='title' />
      <button type='submit'>Create</button>
    </Form>
  );
};
```

**Args:** `{ params, request, context }`

---

## `clientAction`

Handles mutations in the browser:

```tsx
export const clientAction = async ({
  request,
  serverAction,
}: Route.ClientActionArgs) => {
  invalidateClientCache();
  return await serverAction();
};
```

**Args:** `{ params, request, serverAction }`

---

## `middleware`

Runs before/after document and data requests on the server:

```tsx
export const middleware: Route.MiddlewareFunction[] = [
  const auth = async ({ request, context }, next) => {
    const session = await getSession(request);
    if (!session.userId) {
      throw redirect("/login");
    }
    context.set(userContext, await getUser(session.userId));
    return next();
  },
];
```

**Args:** `{ request, params, context }`, `next`

See [middleware reference](./middleware.md) for details.

---

## `clientMiddleware`

Same as `middleware` but runs in browser. No Response returned:

```tsx
export const clientMiddleware: Route.ClientMiddlewareFunction[] = [
  const timing = async ({ request }, next) => {
    const start = performance.now();
    await next();
    console.log(`${request.url} - ${performance.now() - start}ms`);
  },
];
```

---

## `ErrorBoundary`

Renders when loader, action, or component throws:

```tsx
import { isRouteErrorResponse, useRouteError } from 'react-router';

export const ErrorBoundary = () => {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
      </div>
    );
  }

  return <h1>Unknown Error</h1>;
};
```

---

## `HydrateFallback`

Renders during initial load while `clientLoader.hydrate` runs:

```tsx
export const clientLoader = async () => {
  return await loadLocalData();
};
clientLoader.hydrate = true as const;

export const HydrateFallback = () => {
  return <div>Loading...</div>;
};
```

---

## `headers`

Sets HTTP response headers:

```tsx
export const headers = ({ loaderHeaders }: Route.HeadersArgs) => {
  return {
    'Cache-Control': loaderHeaders.get('Cache-Control') ?? 'max-age=3600',
    'X-Custom-Header': 'value',
  };
};
```

---

## `meta`

```tsx
export const meta = ({ loaderData }: Route.MetaArgs) => {
  return [
    { title: loaderData.product.name },
    { name: 'description', content: loaderData.product.description },
  ];
};
```

**Use `loaderData`, not `data`** - the `data` parameter is deprecated.

---

## `links`

Adds `<link>` elements to document head:

```tsx
export const links = () => {
  return [
    { rel: 'stylesheet', href: '/styles/page.css' },
    { rel: 'preload', href: '/images/hero.jpg', as: 'image' },
    { rel: 'icon', href: '/favicon.png', type: 'image/png' },
  ];
};
```

---

## `handle`

Custom data accessible via `useMatches`:

```tsx
export const handle = {
  breadcrumb: 'Dashboard',
  permissions: ['admin'],
};
```

**Usage:**

```tsx
import { useMatches } from 'react-router';

const Breadcrumbs = () => {
  const matches = useMatches();
  const crumbs = matches
    .filter((m) => m.handle?.breadcrumb)
    .map((m) => m.handle.breadcrumb);
  return <nav>{crumbs.join(' > ')}</nav>;
};
```

---

## `shouldRevalidate`

Opt out of automatic loader revalidation:

```tsx
export const shouldRevalidate = ({
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}: Route.ShouldRevalidateFunctionArgs) => {
  // Skip for query-only changes
  if (currentUrl.pathname === nextUrl.pathname) {
    return false;
  }
  return defaultShouldRevalidate;
};
```

---

## Complete Example

```tsx
import type { Route } from "./+types/team";
import {
  Form,
  redirect,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";

export const middleware: Route.MiddlewareFunction[] = [
  const requireAuth = async ({ context }, next) => {
    if (!context.get(userContext)) throw redirect("/login");
    return next();
  },
];

export const loader = async ({ params }: Route.LoaderArgs) => {
  const team = await db.teams.find(params.teamId);
  if (!team) throw new Response("Not Found", { status: 404 });
  return { team };
}

export const action = async ({ request, params }: Route.ActionArgs) => {
  const formData = await request.formData();
  await db.teams.update(params.teamId, { name: formData.get("name") });
  return { success: true };
}

export const headers = () => {
  return { "Cache-Control": "private, max-age=60" };
}

export const MyComponent = ({ loaderData, actionData }: Route.ComponentProps) => {
  return (
    <div>
      <title>{loaderData.team.name}</title>
      <h1>{loaderData.team.name}</h1>
      {actionData?.success && <p>Updated!</p>}
      <Form method="post">
        <input name="name" defaultValue={loaderData.team.name} />
        <button type="submit">Update</button>
      </Form>
    </div>
  );
}

export const ErrorBoundary = () => {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <h1>Team not found</h1>;
  }
  return <h1>Something went wrong</h1>;
}
```

## See Also

- [Route Module Documentation](https://reactrouter.com/start/framework/route-module)
