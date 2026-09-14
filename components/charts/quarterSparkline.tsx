"use client";

import { useId } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// A small line chart of four quarterly values, with the total beside it.
// Shared by the clients table (orders) and the brands table (clients). Hovering a point shows its quarter and value.

const quarters = [
  { label: "Q1 2026", period: "Jan–Mar" },
  { label: "Q2 2026", period: "Apr–Jun" },
  { label: "Q3 2026", period: "Jul–Sep" },
  { label: "Q4 2026", period: "Oct–Dec" },
];

export function QuarterSparkline({ values, total, unit }: { values: number[]; total: number; unit: { one: string; many: string } }) {
  const gradientId = useId();
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const coordinates = values.map((value, index) => {
    const x = 2 + (index * 68) / (values.length - 1);
    const y = 20 - ((value - min) / range) * 16;
    return { x, y, value };
  });
  const points = coordinates.map(({ x, y }) => `${x},${y}`).join(" ");

  return (
    <div className="inline-flex items-center gap-2" aria-label={`${total} ${total === 1 ? unit.one : unit.many} in 2026`}>
      <div className="relative h-6 w-[4.5rem]">
        <svg viewBox="0 0 72 24" className="absolute inset-0 size-full overflow-visible" aria-hidden>
          <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0" /></linearGradient></defs>
          <polygon points={`${points} 70,22 2,22`} fill={`url(#${gradientId})`} />
          <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {coordinates.map(({ x, y, value }, index) => (
          <Tooltip key={quarters[index].label}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  className="group absolute z-10 flex size-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  style={{ left: `${(x / 72) * 100}%`, top: `${(y / 24) * 100}%` }}
                  aria-label={`${quarters[index].label}: ${value} ${value === 1 ? unit.one : unit.many}`}
                />
              }
            >
              <span className="size-1.5 rounded-full border border-white bg-blue-500 opacity-0 transition-opacity group-hover:opacity-100" />
            </TooltipTrigger>
            <TooltipContent>
              <span className="font-medium">{quarters[index].label}</span>
              <span>{quarters[index].period}</span>
              <span>·</span>
              <span>{value} {value === 1 ? unit.one : unit.many}</span>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <span className="min-w-5 font-medium tabular-nums text-foreground">{total}</span>
    </div>
  );
}
