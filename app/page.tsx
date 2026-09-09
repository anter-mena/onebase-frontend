import Link from "next/link";

// Add each new page here so the home page remains the app's page directory.
const pages = [
  { href: "/", title: "All pages" },
  { href: "/login", title: "Login" },
  { href: "/reset-password", title: "Reset password" },
  { href: "/dashboard", title: "Dashboard" },
  { href: "/clients", title: "Clients" },
  { href: "/inbox", title: "WhatsApp Inbox" },
  { href: "/401", title: "401 · Sign in required" },
  { href: "/403", title: "403 · Access denied" },
  { href: "/404", title: "404 · Page not found" },
  { href: "/429", title: "429 · Too many requests" },
  { href: "/500", title: "500 · Unexpected error" },
  { href: "/503", title: "503 · Temporarily unavailable" },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-16">
      <p className="text-sm font-medium text-muted-foreground">One Base</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">All pages</h1>
      <nav aria-label="All pages" className="mt-8">
        <ul className="divide-y rounded-lg border">
          {pages.map((page) => (
            <li key={page.href}>
              <Link
                href={page.href}
                aria-current={page.href === "/" ? "page" : undefined}
                className="flex items-center justify-between gap-4 rounded-lg px-4 py-4 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="font-medium">{page.title}</span>
                <span className="text-sm text-muted-foreground">
                  {page.href}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
