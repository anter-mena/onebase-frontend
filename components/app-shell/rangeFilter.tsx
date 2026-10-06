"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarDays } from "lucide-react";
import { cn } from "cn";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { rangeNote, seoRanges, type SeoRangeId } from "@/lib/seo/types";

/**
 * The period switch: Today, Yesterday, 7 days, This month, This year, Custom
 * (decided 2026-10-05 for SEO; the Dashboard and the Ledger use the same one,
 * 2026-10-06, so a period means the same thing on every screen).
 */
export function RangeFilter({
  value,
  start,
  end,
  onChange,
  onCustom,
}: {
  value: SeoRangeId;
  /** The dates on screen, to start the calendar from. */
  start: string;
  end: string;
  onChange: (next: SeoRangeId) => void;
  onCustom: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<DateRange | undefined>(() => ({
    from: new Date(`${start}T00:00:00`),
    to: new Date(`${end}T00:00:00`),
  }));
  const today = new Date();

  return (
    <div
      role="group"
      aria-label="Period"
      className="inline-flex shrink-0 flex-wrap rounded-lg border border-border/60 bg-muted p-0.5"
    >
      {seoRanges.map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => onChange(entry.id)}
          aria-pressed={value === entry.id}
          className={cn(
            "inline-flex h-6 items-center rounded-md border border-transparent px-2.5 text-[0.7rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
            value === entry.id
              ? "border-border bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {entry.label}
        </button>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              aria-pressed={value === "custom"}
              className={cn(
                "inline-flex h-6 items-center gap-1 rounded-md border border-transparent px-2.5 text-[0.7rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
                value === "custom"
                  ? "border-border bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            />
          }
        >
          <CalendarDays aria-hidden className="size-3" />
          {value === "custom" ? rangeNote({ range: "custom", start, end }) : "Custom"}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-max max-w-[calc(100vw-2rem)] p-0">
          <Calendar
            mode="range"
            selected={picked}
            onSelect={setPicked}
            numberOfMonths={2}
            defaultMonth={picked?.from}
            disabled={{ after: today }}
            fixedWeeks
          />
          <div className="flex items-center justify-end gap-2 px-3 pb-3">
            <span className="mr-auto text-[0.65rem] text-muted-foreground">
              {picked?.from ? format(picked.from, "d MMM yyyy") : "Pick a start"}
              {" – "}
              {picked?.to ? format(picked.to, "d MMM yyyy") : "and an end"}
            </span>
            <button
              type="button"
              disabled={!picked?.from}
              onClick={() => {
                if (!picked?.from) return;
                const to = picked.to ?? picked.from;
                setOpen(false);
                onCustom(format(picked.from, "yyyy-MM-dd"), format(to, "yyyy-MM-dd"));
              }}
              className="h-7 rounded-md border bg-foreground px-3 text-[0.7rem] font-medium text-background disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
