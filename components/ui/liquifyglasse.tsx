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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-white/25"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_1px_1px_0_rgba(255,255,255,0.75),inset_0_0_5px_rgba(255,255,255,0.75)]"
      />
    </>
  );
}

export { LiquidGlassFilter, LiquidGlassLayers };
