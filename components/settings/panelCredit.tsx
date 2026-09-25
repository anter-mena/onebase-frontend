"use client";

import dynamic from "next/dynamic";
import { preload } from "react-dom";
import { Plus } from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import { CoinLoader } from "@/components/settings/coinLoader";
import { hatch } from "@/components/dashboard/hatch";
import { creditBalance, creditsPerLine } from "@/lib/settings/credit";

/**
 * ⚠️ Loaded on demand, and never on the server.
 *
 * <p>`three` and its two React packages come to roughly 150KB over the wire.
 * Imported normally they would land in the Configuration bundle whether or not
 * anybody opens Expenses; behind `next/dynamic` they are a separate chunk
 * fetched when this panel actually renders.
 *
 * <p>`ssr: false` because WebGL does not exist on the server — the canvas has
 * nothing to draw into there, and the drawn coin is the better first paint
 * anyway. It is the `loading` state for the same reason: the reader sees a
 * coin immediately and it is quietly replaced by the mesh.
 */
const Coin3D = dynamic(() => import("@/components/settings/coin3d").then((m) => m.Coin3D), {
  ssr: false,
  loading: () => <CoinLoader className="mx-auto h-[9rem] w-full max-w-[11rem]" />,
});

/**
 * What is left of the panel credit.
 *
 * <p>Credit is what lines are created against upstream: a top-up buys a
 * balance, and every subscription sold spends some of it. It belongs on
 * Expenses because it is the one cost paid before any client pays anything.
 *
 * <p>⚠️ <b>The coin is drawn, not imported.</b> A real 3D mesh would mean
 * `three.js` and `react-three-fiber` — about 150KB over the wire, no server
 * render and a WebGL fallback to write — for an ornament that never moves.
 * Stacked ellipses with gradients give the same read for nothing, render on
 * the server like the rest of the page, and cannot fail to load. The same call
 * the credit-card artwork makes.
 *
 * <p>⚠️ Fixed golds rather than theme tokens. This is an object, not a
 * surface: a coin that turns grey under the Mono palette stops being a coin.
 * The card it sits on follows the theme, as everything else does.
 */

// ⚠️ From the shared module, not restated here. The grid on the other side of
// this tab prices every plan off the same table, and two copies of a rate is
// two figures that eventually disagree in front of somebody.
const monthlyRate = creditsPerLine[1];

const used = creditBalance.total - creditBalance.remaining;
const linesLeft = Math.floor(creditBalance.remaining / monthlyRate);

const numberFormatter = new Intl.NumberFormat("en-GB");

export function PanelCredit() {
  /**
   * ⚠️ Starts the model downloading now, not after the 3D chunk lands.
   *
   * <p>`useGLTF.preload` lives at `coin3d`'s module scope, so it cannot run
   * until that ~150KB chunk has itself arrived — the two downloads were
   * happening one after the other and the spinner was showing for both. This
   * component is in the main bundle, so asking for the file here overlaps them.
   *
   * <p>Called during render, which is where React expects it: it is a hint to
   * the browser, not an effect.
   *
   * <p>⚠️ <b>`crossOrigin` is what makes the hint count.</b> three's loader
   * fetches in CORS mode, and the browser only hands a preloaded response to a
   * request made with the same mode and credentials. Without it the tag went
   * out as a plain no-CORS preload, did not match, and was thrown away — so
   * the 133KB model downloaded twice on every visit to this tab, and Chrome
   * logged "preloaded but not used". "anonymous" is the pair to the loader's
   * default `same-origin` credentials.
   */
  preload("/models/pirate-coin.glb", { as: "fetch", crossOrigin: "anonymous" });

  return (
    // `h-full`, so the column fills the row beside the grid rather than
    // stopping wherever its own content happens to end.
    <div className="flex h-full min-w-0 flex-col rounded-lg border p-4">
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xs font-semibold">Panel credit</h3>
          <p className="mt-0.5 text-[0.7rem] leading-relaxed text-muted-foreground">
            What lines are created against upstream.
          </p>
        </div>

        {/* ⚠️ Here rather than at the foot of the card, and only here. Topping
            up is the one action this panel offers, and a control that sits at
            the bottom of a column that now stretches could end up a long way
            from the number it acts on. */}
        <Button
          type="button"
          size="sm"
          aria-label="Top up credit"
          title="Top up credit"
          className={cn(blackStyle.button, "size-7 shrink-0 justify-center px-0! py-0!")}
        >
          <Plus className="size-3.5" aria-hidden />
        </Button>
      </div>

      {/* Takes the slack the full height creates, so the coin and the figure
          sit in the middle of the card rather than bunched under the heading. */}
      {/* `py-5` above and `mt-5` below, so the coin is not crowded by the
          heading on one side and the balance on the other — it is the one
          picture in a card of text and needs room to read as one. */}
      <div className="flex min-h-0 flex-1 flex-col justify-center py-5">
        <Coin3D className="mx-auto h-[9rem] w-full max-w-[11rem]" />

        <div className="mt-5 text-center">
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            {numberFormatter.format(creditBalance.remaining)}
          </p>
          <p className="mt-0.5 text-[0.7rem] text-muted-foreground">credits remaining</p>
        </div>

        {/* ⚠️ What the number buys, not just the number. "1,240 credits" means
            nothing to anyone who does not already know the rate; "62 lines" is
            the same fact in the unit the business actually sells. */}
        <p className="mt-3 text-center text-[0.7rem] leading-relaxed text-muted-foreground">
          About <span className="font-medium text-foreground">{linesLeft} one-month lines</span> left,
          at {monthlyRate} credits each.
        </p>
      </div>

      <div className="mt-4 shrink-0">
        {/* ⚠️ Remaining, not used — the filled part is what you still have.
            The headline above says "1,240 credits remaining", and a bar whose
            solid portion grew as the balance shrank would contradict it: at
            38% spent it read as a nearly-empty bar over a mostly-full account. */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[0.65rem] text-muted-foreground">Remaining</span>
          <span className="text-[0.65rem] font-medium tabular-nums">
            {numberFormatter.format(creditBalance.remaining)} of{" "}
            {numberFormatter.format(creditBalance.total)}
          </span>
        </div>

        {/* The dashboard's meter, drawn here rather than imported.
            ⚠️ `hatch` is the shared piece; `Meter` is not, and pulling it in
            from `components/dashboard/figures` would drag that module's gauge
            — and the chart library behind it — into the Configuration bundle
            for one bar. Same call `DeviceSplit` makes on the SEO page. */}
        <div className="mt-1.5 flex h-7 w-full gap-1">
          <span
            className="h-full min-w-1.5 rounded-[6px]"
            style={{
              flex: "1 1 0",
              flexGrow: creditBalance.remaining,
              backgroundImage: hatch("var(--viz-ramp-2)", { line: 2.5, pitch: 9 }),
            }}
          />
          {used > 0 ? (
            // Flat, not hatched: the texture marks what is there, and this is
            // the part that has been spent.
            <span
              className="h-full min-w-1.5 rounded-[6px]"
              style={{ flex: "1 1 0", flexGrow: used, background: "var(--viz-ramp-rest)" }}
            />
          ) : null}
        </div>

        <p className="mt-2 text-[0.65rem] text-muted-foreground">
          Last top-up {creditBalance.at} · {numberFormatter.format(creditBalance.total)} credits
        </p>
      </div>

        {/* No second top-up button down here: the one in the header is it.
            Two controls for one action in one card is a card that makes the
            reader check whether they do the same thing. */}

      {/* Ties back to what the Panel tab says: nothing reads this from a
          provider yet, so the figure is whatever was last entered by hand. */}
      <p className="mt-3 text-[0.65rem] leading-relaxed text-muted-foreground">
        Entered by hand for now. It will read from the provider once the panel
        API arrives.
      </p>
    </div>
  );
}
