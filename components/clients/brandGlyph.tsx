import { cn } from "cn";

/**
 * A brand logo in the surrounding ink.
 *
 * <p>A CSS mask rather than an `<img>`, the trick the dashboard’s brand split
 * uses: Simple Icons ship black, and an `<img>` of one disappears on a dark
 * card. As a mask it takes `currentColor`, so it reads on every palette and in
 * both modes with no per-mode artwork.
 *
 * <p>Its own file, with no `"use client"`, so the server-rendered profile and
 * the client-side table and form can all draw a logo the same way.
 */
export function BrandGlyph({ src, className }: { src: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("block shrink-0 bg-current", className)}
      style={{ mask: `url(${src}) center / contain no-repeat`, WebkitMask: `url(${src}) center / contain no-repeat` }}
    />
  );
}
