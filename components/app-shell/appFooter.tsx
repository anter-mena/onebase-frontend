import Link from "next/link";
import { LifeBuoy } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="sticky bottom-0 z-20 flex h-8 shrink-0 items-center justify-end gap-2 bg-transparent px-4 text-[0.65rem] text-muted-foreground md:px-6">
      <Link
        href="mailto:support@onebase.com"
        className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline"
      >
        <LifeBuoy className="size-3" aria-hidden />
        Support
      </Link>
      <span className="h-3 w-px bg-border" aria-hidden />
      <p>© 2026 One Base</p>
    </footer>
  );
}
