"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";

/**
 * The bar above a printed receipt: it opens the print window once the slip has
 * drawn — where "Save as PDF" downloads it — and offers it again. Never printed.
 */
export function PrintReceiptBar() {
  useEffect(() => {
    // After the logo and fonts have had a moment to land.
    const timer = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 text-center print:hidden">
      <Button
        type="button"
        size="sm"
        onClick={() => window.print()}
        className={cn(blackStyle.button, "gap-1.5 px-3! py-0! text-[0.65rem]! font-normal!")}
      >
        <Printer className="size-3" aria-hidden />
        Print or save as PDF
      </Button>
      <p className="max-w-xs text-[0.65rem] text-muted-foreground">
        Made for 80 mm receipt printers. To download it, choose &ldquo;Save as PDF&rdquo; in the print window.
      </p>
    </div>
  );
}
