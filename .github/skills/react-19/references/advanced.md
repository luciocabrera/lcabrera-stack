# React 19 Advanced Features

Edge-case features for specific use cases. Main patterns are in [SKILL.md](../SKILL.md).

---

## Document Metadata

Render metadata tags anywhere in component tree. React hoists to `<head>` automatically.

```typescript
type BlogPostProps = {
  readonly post: { readonly title: string; readonly excerpt: string; readonly image: string; readonly content: string };
}

export const BlogPost = ({ post }:BlogPostProps) => {
  return (
    <article>
      <title>{post.title}</title>
      <meta name="description" content={post.excerpt} />
      <meta property="og:title" content={post.title} />
      <meta property="og:image" content={post.image} />

      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
};
```

---

## Stylesheet Support

```typescript
export const ComponentWithStyles = () => {
  return (
    <div>
      <link rel="stylesheet" href="/styles/component.css" precedence="default" />
      <MyComponent />
    </div>
  );
};
```

**`precedence`** controls stylesheet loading order: `"reset"` < `"low"` < `"medium"` < `"high"`.

---

## Async Script Support

```typescript
export const Analytics= () => {
  return <script async src="https://analytics.example.com/script.js" />;
};
```

React deduplicates scripts automatically (same `src` = single load).

---

## Resource Preloading

```typescript
import { prefetchDNS, preconnect, preload, preinit } from "react-dom";

export const MyComponent= () => {
  // Preload resources
  preload("/fonts/myfont.woff2", { as: "font" });
  preinit("/scripts/analytics.js", { as: "script" });

  return <div>Content</div>;
};
```

---

## Breaking Changes from React 18

| Removed              | Alternative                   |
| -------------------- | ----------------------------- |
| `forwardRef`         | Use `ref` as prop             |
| `<Context.Provider>` | Use `<Context>` directly      |
| `useFormState`       | Use `useActionState`          |
| String refs          | Use `useRef` or callback refs |
| `defaultProps`       | Use default parameters        |
| Legacy Context       | Use `createContext`           |
| `propTypes`          | Use TypeScript                |
