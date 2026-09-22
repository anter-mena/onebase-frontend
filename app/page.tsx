import Link from "next/link";

// Add each new page here so the home page remains the app's page directory.
const pages = [
  { href: "/", title: "All pages" },
  { href: "/login", title: "Login" },
  { href: "/reset-password", title: "Reset password" },
  { href: "/dashboard", title: "Dashboard" },
  { href: "/seo-overview", title: "SEO Overview" },
  { href: "/clients", title: "Clients" },
  { href: "/renewals", title: "Renewals" },
  { href: "/inbox", title: "Inbox" },
  { href: "/whatsapp-inbox", title: "WhatsApp Inbox" },
  { href: "/settings?tab=brands", title: "Configuration · Brands" },
  { href: "/settings?tab=panel", title: "Configuration · Panel" },
  { href: "/settings?tab=expenses", title: "Configuration · Expenses" },
  { href: "/settings?tab=subscriptions", title: "Configuration · Subscriptions" },
  { href: "/settings?tab=payment-methods", title: "Configuration · Payment methods" },
  { href: "/settings/payment-methods/new", title: "New payment method" },
  { href: "/settings/payment-methods/paypal/edit", title: "Edit payment method (PayPal)" },
  { href: "/401", title: "401 · Sign in required" },
  { href: "/403", title: "403 · Access denied" },
  { href: "/404", title: "404 · Page not found" },
  { href: "/429", title: "429 · Too many requests" },
  { href: "/500", title: "500 · Unexpected error" },
  { href: "/503", title: "503 · Temporarily unavailable" },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
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
                <span className="min-w-0 font-medium">{page.title}</span>
                {/* One line: the path never wraps; on a narrow phone it is cut with "…" instead. */}
                <span className="truncate text-sm whitespace-nowrap text-muted-foreground">
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
