const FILTER_ID = "liquid-glass";

// Mount once in the root layout: SVG filter IDs are document-global.
function LiquidGlassFilter() {
  return (
    <svg aria-hidden focusable="false" className="pointer-events-none absolute size-0">
      <filter id={FILTER_ID} x="0%" y="0%" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.008 0.008"
          numOctaves={2}
          seed={92}
          result="noise"
        />
        <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="blurred"
          scale={70}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}

// Place before content in a relative, overflow-hidden surface.
// Position content relatively so it paints above the decorative layers.
function LiquidGlassLayers() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 isolate backdrop-blur-[2px]"
        style={{ filter: `url(#${FILTER_ID})` }}
      />
      {/* ⚠️ Much less white in dark. A quarter-opacity white wash over a dark
          surface lifts it to a mid grey, and the foreground text — which is
          near-white in every dark palette — lands on top of that with almost no
          contrast left. That is what made the sidebar's user box unreadable.
          The glass is kept; it is the amount of white that changes. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-white/25 dark:bg-white/[0.06]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_1px_1px_0_rgba(255,255,255,0.75),inset_0_0_5px_rgba(255,255,255,0.75)] dark:shadow-[inset_1px_1px_0_rgba(255,255,255,0.16),inset_0_0_5px_rgba(255,255,255,0.1)]"
      />
    </>
  );
}

export { LiquidGlassFilter, LiquidGlassLayers };
