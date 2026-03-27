import type { Route } from "../+types/root.ts";

export const links: Route.LinksFunction = () => [
  { href: "/favicon.ico", rel: "icon" },
  { href: "/index.css", rel: "stylesheet" },
];
