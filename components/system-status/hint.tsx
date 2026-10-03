"use client";

import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { cn } from "cn";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * What a figure means, one hover (or tap, or Tab) away.
 *
 * <p>{@link Hint} is a small "?" beside a card title; {@link HintedLabel} turns
 * the label itself into the trigger, for lists where a column of icons would be
 * noisier than the numbers. Both are real buttons, so the explanation can be
 * reached by keyboard and on a phone — on this page the explanation is half the
 * point.
 */

/** Prose, not chips: the tooltip is inline-flex by default, which breaks a sentence into columns. */
const PROSE = "block max-w-[16rem] text-left leading-snug";

export function Hint({ children }: { children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label="What is this?"
            className="rounded-sm text-muted-foreground/70 normal-case transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        }
      >
        <CircleHelp className="size-3" aria-hidden />
      </TooltipTrigger>
      <TooltipContent className={PROSE}>{children}</TooltipContent>
    </Tooltip>
  );
}

export function HintedLabel({
  label,
  children,
  className,
}: {
  label: ReactNode;
  /** The explanation. */
  children: ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className={cn(
              "cursor-help rounded-sm text-left underline decoration-dotted decoration-muted-foreground/50 underline-offset-4 transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
              className,
            )}
          />
        }
      >
        {label}
      </TooltipTrigger>
      <TooltipContent className={PROSE}>{children}</TooltipContent>
    </Tooltip>
  );
}
