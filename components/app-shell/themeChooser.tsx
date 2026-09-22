"use client";

import { useState } from "react";
import { Check, Moon, Sun } from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "@/hooks/use-theme";
import { themes, type ThemeId, type ThemeMode } from "@/lib/theme/themes";

/**
 * Picking a palette, and which half of it, in the Theme tab of the account
 * settings.
 *
 * <p>A fixed list, not an editor. Every theme is a pair of token blocks in
 * `app/themes.css`; there is nothing here to set a colour with, and that is
 * deliberate — a workspace where anybody can put `--primary` to anything is a
 * workspace where no two screenshots agree.
 *
 * <p><b>Nothing is applied until Save.</b> Everything else in this application
 * that changes a preference does it on the spot, so this is the odd one out and
 * worth naming: choosing a palette repaints every pixel on screen, and trying
 * five of them in a row to compare is a lot of that. Holding the choice in a
 * draft makes the panel a form with one commit, which is also what makes
 * Discard mean something.
 *
 * <p>It is safe to render from `useTheme`'s values here, unlike in the navbar:
 * the window this lives in only ever mounts in the browser, so there is no
 * server pass whose answer could differ. It is also why the draft can be seeded
 * from them directly — this component is built fresh each time the window
 * opens, so the draft always starts from what is actually on.
 */

const modes: readonly { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

/** Same segmented control as the currency switch on the Subscriptions tab. */
function ModeSwitch({
  mode,
  onChange,
}: {
  mode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Light or dark"
      className="inline-flex shrink-0 rounded-lg border border-border/60 bg-muted p-0.5"
    >
      {modes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={mode === value}
          className={cn(
            "inline-flex h-6 items-center gap-1.5 rounded-md border border-transparent px-2 text-[0.7rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
            mode === value
              ? "border-border bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-3" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}

/**
 * A small picture of the theme, built from the theme's own tokens.
 *
 * <p>It carries no `data-theme` of its own: the card around it does, and custom
 * properties inherit. So everything here resolves against the palette that card
 * is advertising rather than the one currently on. No hex values in TypeScript,
 * and nothing to keep in step with the stylesheet — a change to a theme's
 * tokens shows up here by itself.
 *
 * <p>⚠️ These follow the mode that is <em>applied</em>, not the one in the
 * draft. `app/themes.css` scopes each dark block to `.dark [data-theme="…"]`,
 * and `.dark` is on `<html>` — a wrapper here can add that ancestor but cannot
 * take it away, so a draft of Light while the application is Dark could not be
 * shown. Rather than have it work in one direction only, it does neither: the
 * segmented control above says which mode is drafted, and these say which
 * palette. Making both live would mean a `.light` escape hatch beside all nine
 * dark blocks.
 *
 * <p>A sidebar, two lines of text and a primary button, because those are the
 * three things that actually differ between these palettes at a glance. The
 * radius is the theme's own, so the square themes look square.
 */
function ThemePreview() {
  return (
    <span
      aria-hidden
      className="flex h-16 w-full overflow-hidden rounded-md border border-border bg-background"
    >
      <span className="w-1/3 shrink-0 border-r border-border bg-sidebar" />
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-2">
        <span className="block h-1.5 w-3/4 rounded-full bg-foreground opacity-70" />
        <span className="block h-1.5 w-1/2 rounded-full bg-muted-foreground opacity-60" />
        <span className="mt-1 block h-3 w-2/3 rounded bg-primary" />
      </span>
    </span>
  );
}

export function ThemeChooser() {
  const { theme, mode, setTheme, setMode } = useTheme();

  const [draftTheme, setDraftTheme] = useState<ThemeId>(theme);
  const [draftMode, setDraftMode] = useState<ThemeMode>(mode);

  const dirty = draftTheme !== theme || draftMode !== mode;

  function save() {
    // Each guarded, so saving a palette change does not also rewrite the mode
    // cookie and broadcast a mode change nothing asked for.
    if (draftTheme !== theme) setTheme(draftTheme);
    if (draftMode !== mode) setMode(draftMode);
  }

  function discard() {
    setDraftTheme(theme);
    setDraftMode(mode);
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="theme-mode-heading">
        {/* No flex-wrap. Wrapping made the switch jump to a line of its own the
            moment the sentence beside it grew — which is a layout that depends
            on how wide a particular string happens to render. The heading
            column takes what is left and the text wraps inside it instead, so
            this row is two columns at every width. */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 id="theme-mode-heading" className="text-sm font-medium">
              Appearance
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Every palette comes in both. This picks which half you see.
            </p>
          </div>
          <ModeSwitch mode={draftMode} onChange={setDraftMode} />
        </div>
      </section>

      <section aria-labelledby="theme-palette-heading">
        <h3 id="theme-palette-heading" className="text-sm font-medium">
          Palette
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Remembered on this device.
        </p>

        <RadioGroup
          value={draftTheme}
          onValueChange={(value) => setDraftTheme(value as ThemeId)}
          className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {themes.map((option) => {
            const chosen = option.id === draftTheme;

            return (
              // A label around the radio, so the whole card is the target
              // rather than the small circle in its corner.
              //
              // data-theme sits on the card, not just on the picture inside it.
              // Custom properties inherit, so every token the card draws itself
              // with — the border, the background, the text, the ring, and
              // `--radius` through `rounded-xl` — comes from the palette the
              // card is advertising rather than from the one currently on. A
              // Mono card is square while a Twitter card beside it is round,
              // whichever of them is selected, because that is a true thing
              // about those palettes.
              <label
                key={option.id}
                data-theme={option.id}
                className={cn(
                  "group relative flex cursor-pointer flex-col gap-2 rounded-xl border bg-background p-2 text-foreground transition-colors",
                  "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
                  chosen ? "border-primary/40 bg-primary/5" : "hover:bg-muted/50",
                )}
              >
                <ThemePreview />

                <span className="flex items-center gap-2">
                  {/* sr-only rather than absent: the card carries the click and
                      the highlight, but the radio is what a screen reader and
                      the arrow keys actually operate. */}
                  <RadioGroupItem
                    value={option.id}
                    aria-label={option.label}
                    className="sr-only"
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium">
                    {option.label}
                  </span>
                  {chosen ? (
                    <Check
                      className="size-3.5 shrink-0 text-primary"
                      aria-hidden
                    />
                  ) : null}
                </span>
              </label>
            );
          })}
        </RadioGroup>
      </section>

      {/* Same footer as the payment method form: quiet way back on the left of
          the commit, both at the end of the panel. */}
      <div className="flex items-center justify-end gap-2 border-t pt-4">
        {/* Only once there is something to go back to. A Discard that is
            permanently greyed out is a control that never does anything. */}
        {dirty ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={discard}
            className={cn(whiteStyle.button, "px-3! py-0! text-xs! font-medium!")}
          >
            Discard
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          onClick={save}
          disabled={!dirty}
          className={cn(
            blackStyle.button,
            "px-3! py-0! text-xs! font-medium! disabled:opacity-50",
          )}
        >
          Save changes
        </Button>
      </div>

      {/* Announced rather than drawn, so the panel does not shift as the
          message comes and goes. */}
      <p aria-live="polite" className="sr-only">
        {dirty ? "You have unsaved theme changes." : "Theme saved."}
      </p>
    </div>
  );
}
