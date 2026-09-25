"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { cn } from "cn";

import { InfoCard, cardActionClassName } from "@/components/clients/infoCard";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import { Textarea } from "@/components/ui/textarea";

/**
 * A free-text note about the client — what the team should know before the
 * next call.
 *
 * <p>Edited in place rather than in a window: a note is a sentence or two, and
 * a dialog for that is more ceremony than the text. The card swaps its body for
 * a textarea and back, and nothing around it moves.
 *
 * <p>Interface phase: a saved note lives in this component until the page is
 * reloaded, the same as an added payment. The API call goes in `save` and
 * nothing else changes.
 */

/** Long enough for real context, short enough to stay a note rather than a file. */
const MAX_LENGTH = 500;

export function ClientNote({
  initialNote,
  className,
}: {
  initialNote?: string;
  className?: string;
}) {
  const [note, setNote] = useState(initialNote?.trim() ?? "");
  const [draft, setDraft] = useState<string | null>(null);
  const editing = draft !== null;

  const startEditing = () => setDraft(note);
  const cancel = () => setDraft(null);

  function save() {
    if (draft === null) return;
    // Trimmed, so a note of only spaces goes back to "no note" rather than
    // leaving an empty-looking card that claims to have something in it.
    setNote(draft.trim());
    setDraft(null);
  }

  return (
    <InfoCard
      title="Note"
      className={className}
      contentClassName="flex min-h-0 flex-1 flex-col"
      action={
        editing ? null : (
          <button type="button" onClick={startEditing} className={cardActionClassName}>
            {note ? <Pencil className="size-3" aria-hidden /> : <Plus className="size-3" aria-hidden />}
            {note ? "Edit" : "Add"}
          </button>
        )
      }
    >
      {editing ? (
        <form
          className="flex min-h-0 flex-1 flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <Textarea
            aria-label="Note about this client"
            autoFocus
            value={draft}
            maxLength={MAX_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // The two shortcuts every note field has taught people: ⌘/Ctrl
              // + Enter keeps it, Escape walks away from it.
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                save();
              } else if (event.key === "Escape") {
                event.preventDefault();
                cancel();
              }
            }}
            placeholder="Preferences, promises, context for the next call…"
            // `field-sizing-content` from the primitive grows it with the text;
            // `flex-1` lets it fill the card when the card is taller than that.
            className="min-h-24 flex-1 resize-none text-xs md:text-xs"
          />
          <div className="flex items-center justify-between gap-2">
            {/* The limit shown only once it is near, so it is information
                rather than a number to watch from the first keystroke. */}
            <span
              className={cn(
                "text-[0.6rem] tabular-nums text-muted-foreground",
                draft.length < MAX_LENGTH * 0.8 && "invisible",
              )}
              aria-live="polite"
            >
              {draft.length}/{MAX_LENGTH}
            </span>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={cancel} className="h-7 px-3 text-[0.65rem] font-normal">
                Cancel
              </Button>
              <Button type="submit" size="sm" className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}>
                Save note
              </Button>
            </div>
          </div>
        </form>
      ) : note ? (
        // `pre-wrap`, so the line breaks somebody typed are the ones shown.
        <p className="text-xs leading-relaxed break-words whitespace-pre-wrap">{note}</p>
      ) : (
        // The empty state is itself the way in: one click from "nothing here"
        // to typing, with no need to find the small Add in the header.
        <button
          type="button"
          onClick={startEditing}
          className="flex min-h-24 flex-1 items-center justify-center rounded-lg border border-dashed px-4 text-center text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          No note yet. Add what the team should know about this client.
        </button>
      )}
    </InfoCard>
  );
}
