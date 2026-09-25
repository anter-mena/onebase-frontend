import { Coins } from "lucide-react";
import { cn } from "cn";

/**
 * What stands in for the coin while it loads, and if it never arrives.
 *
 * <p>⚠️ Its own file so both sides can reach it. `panelCredit` needs it for
 * `next/dynamic`'s `loading`, which runs before the 3D chunk exists, and
 * `coin3d` needs it for Suspense and its error boundary. Putting it inside
 * `coin3d` would mean the loader could only appear once the thing it is a
 * loader for had already downloaded.
 */

/**
 * A spinner, and the same one at every stage.
 *
 * <p>⚠️ The loading path has three steps — the server's first paint, the
 * dynamic chunk arriving, then the model itself — and each one hands over to
 * the next. When they looked different the reader saw a sequence of unrelated
 * placeholders rather than one wait; identical markup at all three makes it a
 * single spinner that simply keeps turning until the coin is there.
 *
 * <p>Drawn with a border rather than an icon: no import, and it inherits the
 * theme's tokens, so it is right in both modes without a second thought.
 */
export function CoinLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center bg-transparent", className)}>
      <span
        aria-hidden
        className="size-4 animate-spin rounded-full border border-muted border-t-muted-foreground/70 motion-reduce:animate-none"
      />
      <span className="sr-only">Loading the credit coin</span>
    </div>
  );
}

/**
 * When the mesh cannot be shown at all — no file, no WebGL, a broken model.
 *
 * <p>⚠️ Deliberately not the spinner. One that never stops says "any moment
 * now" forever; a plain icon says the picture is not coming and moves on. The
 * figures underneath are the point of the panel and they are all still there.
 */
export function CoinUnavailable({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center bg-transparent", className)}>
      <Coins className="size-10 text-muted-foreground/40" aria-hidden />
      <span className="sr-only">The credit coin could not be displayed</span>
    </div>
  );
}
