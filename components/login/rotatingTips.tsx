"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { LiquidGlassLayers } from "@/components/ui/liquifyglasse";

const tips = [
  {
    title: "Know your clients",
    description: "Keep contact details and client history together in one place.",
  },
  {
    title: "Keep orders organized",
    description: "See which services each client ordered and review the details.",
  },
  {
    title: "Keep conversations close",
    description: "Read and send WhatsApp messages directly from One Base.",
  },
  {
    title: "See every subscription",
    description: "Keep track of your clients’ subscriptions and service details.",
  },
  {
    title: "Stay on top of renewals",
    description: "See upcoming renewals so you know when to follow up with clients.",
  },
  {
    title: "Understand your business",
    description: "Review reports on your clients, orders, and subscriptions.",
  },
];

export function RotatingTips() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  return (
    <div className="w-full px-4 text-xs leading-relaxed text-white" aria-label="One Base feature tips">
      <div className="relative grid overflow-hidden rounded-lg border border-white/30 p-4 shadow-sm">
        <LiquidGlassLayers />
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? "Resume tips" : "Pause tips"}
          className="absolute right-3 top-3 z-10 flex size-6 items-center justify-center rounded-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {paused ? <Play className="size-3" aria-hidden /> : <Pause className="size-3" aria-hidden />}
        </button>
        {tips.map((tip, index) => (
          <div
            key={tip.title}
            aria-hidden={index !== activeIndex}
            className={`relative col-start-1 row-start-1 transition-opacity duration-500 motion-reduce:transition-none ${
              index === activeIndex ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <h2 className="mb-1 pr-8 text-sm font-semibold text-white">{tip.title}</h2>
            <p>{tip.description}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center px-2">
        <div className="flex flex-1 items-center gap-1.5" role="group" aria-label="Choose a tip">
          {tips.map((tip, index) => (
            <button
              key={tip.title}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Tip ${index + 1}: ${tip.title}`}
              aria-current={index === activeIndex ? "true" : undefined}
              className="flex h-6 min-w-0 flex-1 items-start rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span className="h-1 w-full overflow-hidden rounded-full bg-white/25" aria-hidden>
                <span
                  key={activeIndex}
                  className={`block h-full w-full origin-left rounded-full bg-white ${
                    index === activeIndex
                      ? "animate-[tip-progress_5s_linear_forwards]"
                      : index < activeIndex ? "scale-x-100" : "scale-x-0"
                  }`}
                  style={{ animationPlayState: paused ? "paused" : "running" }}
                  onAnimationEnd={index === activeIndex ? () => setActiveIndex((current) => (current + 1) % tips.length) : undefined}
                />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
