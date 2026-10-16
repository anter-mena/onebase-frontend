"use client";

import { useState, type ReactNode } from "react";
import { cn } from "cn";

/** "New Balance" → "NB": what stands in for a brand with no logo, or one that won't load. */
export function brandInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * A brand logo, as it is on the brand's own website.
 *
 * <p>Logos are not stored (decided 2026-10-16): `logoUrl` is the logo's address
 * on the brand's site, so this is a plain `<img>` loading it from there — not
 * `next/image`, which would fetch it through our server, and not a CSS mask,
 * which other sites refuse (masks need CORS) and which turns a square app icon
 * into a solid block. It keeps its own colours.
 *
 * <p>No referrer, so the brand's site doesn't learn our page addresses. A site
 * can move or delete its logo at any time: when it fails to load, `fallback`
 * is shown instead — by default the initials of `name`, or nothing without one.
 *
 * <p>A client component (it listens for the error), usable from the
 * server-rendered profile and the client-side tables and forms alike.
 */
export function BrandGlyph({
  src,
  name,
  className,
  fallback,
}: {
  src: string | null | undefined;
  name?: string;
  className?: string;
  fallback?: ReactNode;
}) {
  // The address that failed, so a new address is tried again without an effect.
  const [failed, setFailed] = useState<string | null>(null);

  if (!src || failed === src) {
    if (fallback !== undefined) return <>{fallback}</>;
    if (!name) return null;
    return (
      <span
        aria-hidden
        className={cn("flex shrink-0 items-center justify-center rounded-sm bg-muted text-[0.45rem] leading-none font-semibold text-muted-foreground", className)}
      >
        {brandInitials(name)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- a logo on the brand's own website, loaded from there (see above)
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(src)}
      // An image that failed before the page became interactive fires no onError: check once it is attached.
      // (Not for SVG: one without a size can report a width of 0 while showing fine.)
      ref={(node) => {
        if (node && node.complete && node.naturalWidth === 0 && !/\.svg([?#]|$)/i.test(src)) setFailed(src);
      }}
      className={cn("block shrink-0 object-contain", className)}
    />
  );
}
