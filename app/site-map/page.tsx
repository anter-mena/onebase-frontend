import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Site map",
  robots: { index: false, follow: false },
};

/**
 * Built once, when the app is built: the list below is read from the `app`
 * folder then, so a new page shows up here on its own at the next deploy.
 */
export const dynamic = "force-static";

/**
 * Every page of the app in one list, for checking screens quickly.
 *
 * <p>Behind HTTP Basic, like Swagger: proxy.ts asks for `SITEMAP_USERNAME` /
 * `SITEMAP_PASSWORD` before this page is served. Opening a link still goes
 * through the app's own rules (sign-in, role).
 *
 * <p>Nothing to update by hand. What it cannot show: tabs inside a page
 * (`?tab=…`), and real addresses for pages that need an id (`/clients/[id]`) —
 * those are listed without a link.
 */

type Page = { route: string; title: string; linkable: boolean };

const APP_DIR = path.join(process.cwd(), "app");

/** Route groups as they read on the site map; any other group lands under "Other". */
const SECTIONS: { group: string; title: string }[] = [
  { group: "(auth)", title: "Sign-in pages" },
  { group: "(private)", title: "App pages" },
  { group: "(errors)", title: "Error pages" },
];

/** Not pages to visit: "/" only redirects to sign in, and this list itself. */
const SKIP = new Set(["/", "/site-map"]);

function findPages(dir: string, segments: string[]): (Page & { group: string })[] {
  const pages: (Page & { group: string })[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      // _folders are private to Next.js, @slots and (.)intercepts are not addresses.
      if (/^[_@]|^\(\./.test(entry.name)) continue;
      pages.push(...findPages(path.join(dir, entry.name), [...segments, entry.name]));
    } else if (entry.name === "page.tsx") {
      const group = segments.find((segment) => /^\(.+\)$/.test(segment)) ?? "";
      const urlSegments = segments.filter((segment) => !/^\(.+\)$/.test(segment));
      const route = "/" + urlSegments.join("/");
      if (SKIP.has(route)) continue;
      pages.push({
        route,
        group,
        title: titleOf(path.join(dir, entry.name), urlSegments),
        linkable: !urlSegments.some((segment) => segment.startsWith("[")),
      });
    }
  }
  return pages;
}

/** The page's own `metadata.title` without " | One Base"; else its folder name. */
function titleOf(file: string, urlSegments: string[]): string {
  const found = readFileSync(file, "utf8").match(/title:\s*["'`]([^"'`]+)["'`]/);
  if (found) return found[1].replace(/\s*\|\s*One Base$/, "");
  const last = urlSegments.filter((segment) => !segment.startsWith("[")).at(-1) ?? "Page";
  const words = last.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export default function SiteMapPage() {
  const pages = findPages(APP_DIR, []).sort((a, b) => a.route.localeCompare(b.route));
  const sections = [
    ...SECTIONS.map(({ group, title }) => ({ title, pages: pages.filter((page) => page.group === group) })),
    { title: "Other", pages: pages.filter((page) => !SECTIONS.some((section) => section.group === page.group)) },
  ].filter((section) => section.pages.length > 0);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <p className="text-sm font-medium text-muted-foreground">One Base</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Site map</h1>
      <p className="mt-1 text-sm text-muted-foreground">{pages.length} pages, read from the app when it was built.</p>
      {sections.map((section) => (
        <nav key={section.title} aria-label={section.title} className="mt-8">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">{section.title}</h2>
          <ul className="divide-y rounded-lg border">
            {section.pages.map((page) => (
              <li key={page.route}>
                {page.linkable ? (
                  <Link
                    href={page.route}
                    className="flex items-center justify-between gap-4 rounded-lg px-4 py-4 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <PageRow page={page} />
                  </Link>
                ) : (
                  // Needs a real id to open, so there is no address to link to.
                  <div className="flex items-center justify-between gap-4 px-4 py-4 text-muted-foreground" title="Needs an id — open it from its list">
                    <PageRow page={page} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </main>
  );
}

function PageRow({ page }: { page: Page }) {
  return (
    <>
      <span className="min-w-0 font-medium">{page.title}</span>
      {/* One line: the path never wraps; on a narrow phone it is cut with "…" instead. */}
      <span className="truncate text-sm whitespace-nowrap text-muted-foreground">{page.route}</span>
    </>
  );
}
