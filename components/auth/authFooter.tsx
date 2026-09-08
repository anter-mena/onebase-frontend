import { LifeBuoy } from "lucide-react";
import Link from "next/link";

export function AuthFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-6 py-8 text-xs text-muted-foreground md:px-10 lg:py-10">
      <div className="flex flex-wrap items-center gap-4">
        <p>© 2026 One Base</p>
        <Link href="#" className="inline-flex items-center gap-1 hover:text-foreground">
          <LifeBuoy className="size-3" aria-hidden />
          Help Center
        </Link>
      </div>
      <nav aria-label="Legal" className="flex items-center gap-4">
        <Link href="#" className="underline-offset-4 hover:text-foreground hover:underline">Privacy Policy</Link>
        <Link href="#" className="underline-offset-4 hover:text-foreground hover:underline">Terms of Use</Link>
      </nav>
    </footer>
  );
}
