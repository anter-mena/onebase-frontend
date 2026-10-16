"use client";

import { useRef, useState, type ReactNode } from "react";
import { Reorder, useDragControls } from "motion/react";
import {
  Bold, ChevronDown, ChevronUp, Code, FileText, FileUp, GripVertical, ImageIcon, Italic, Loader2, Mic,
  MousePointerClick, Strikethrough, Type, X, type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { Input } from "@/components/ui/input";
import { bytes } from "@/lib/format";
import { BUTTON_TYPES, MEDIA_RULES, TEMPLATE_LIMITS } from "@/lib/templates/rules";
import type { TemplateBlockType, TemplateButtonType, TemplateFile, TemplateMediaType } from "@/lib/templates/types";

/**
 * The pieces of the builder's Message card: a row that can be moved, and the
 * editor of each kind of block. The state lives in the builder.
 */

export const BLOCK_ICONS: Record<TemplateBlockType, LucideIcon> = {
  TEXT: Type,
  IMAGE: ImageIcon,
  DOCUMENT: FileText,
  AUDIO: Mic,
  BUTTON: MousePointerClick,
};

/** The small white buttons of the card (add, replace…), the same size as the page's header buttons. */
export const smallWhiteButton = cn(whiteStyle.button, "h-7 px-2.5! py-0! text-[0.65rem]! font-normal!");

const arrowClass =
  "flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:pointer-events-none disabled:opacity-30";

/**
 * One block of the list: dragged by its grip, or moved with the arrows (keyboard
 * and touch). `value` must be the very object held in the list given to `Reorder.Group`.
 */
export function ReorderRow<T>({
  value,
  index,
  count,
  label,
  onMove,
  children,
}: {
  value: T;
  index: number;
  count: number;
  /** Read out with the arrows, e.g. "Photo 1". */
  label: string;
  onMove: (offset: -1 | 1) => void;
  children: ReactNode;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      as="li"
      value={value}
      // Only the grip starts a drag, so text in the row can still be selected.
      dragListener={false}
      dragControls={controls}
      className="relative flex items-stretch overflow-hidden rounded-xl border bg-background"
      whileDrag={{ boxShadow: "0 8px 20px -6px rgba(0,0,0,0.25)", zIndex: 10 }}
    >
      <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 border-r bg-muted/40 px-0.5 py-1">
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${label} up`} title="Move up" className={arrowClass}>
          <ChevronUp className="size-3" />
        </button>
        <span
          onPointerDown={(event) => controls.start(event)}
          aria-hidden
          title="Drag to move"
          className="flex size-5 cursor-grab touch-none items-center justify-center text-muted-foreground hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" />
        </span>
        <button type="button" onClick={() => onMove(1)} disabled={index === count - 1} aria-label={`Move ${label} down`} title="Move down" className={arrowClass}>
          <ChevronDown className="size-3" />
        </button>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </Reorder.Item>
  );
}

/** The block's title line: what it is, and a way to remove it. */
export function BlockHeader({ icon: Icon, title, onRemove }: { icon: LucideIcon; title: string; onRemove: () => void }) {
  return (
    <div className="flex h-8 items-center gap-2 border-b px-3">
      <Icon className="size-3.5 text-muted-foreground" aria-hidden />
      <span className="text-[0.7rem] font-medium">{title}</span>
      <Button type="button" variant="ghost" size="icon-xs" onClick={onRemove} aria-label={`Remove ${title}`} title="Remove" className="ml-auto">
        <X className="size-3" />
      </Button>
    </div>
  );
}

/** Each wraps the selection in WhatsApp's markers. */
const FORMAT_ACTIONS = [
  { marker: "*", label: "Bold", icon: Bold },
  { marker: "_", label: "Italic", icon: Italic },
  { marker: "~", label: "Strikethrough", icon: Strikethrough },
  { marker: "```", label: "Monospace", icon: Code },
] as const;

/**
 * A text: the formatting buttons and the text, held under `maxLength` (what the
 * other texts leave of the shared budget). The counter is for all texts together.
 */
export function TextBlockEditor({
  id,
  value,
  maxLength,
  total,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  maxLength: number;
  /** Characters of all the texts, for the shared counter. */
  total: number;
  onChange: (text: string) => void;
  placeholder: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function wrapSelection(marker: string) {
    const element = ref.current;
    if (!element) return;
    const { selectionStart: start, selectionEnd: end } = element;
    const selected = value.slice(start, end) || "text";
    const text = value.slice(0, start) + marker + selected + marker + value.slice(end);
    if (text.length > maxLength) return;
    onChange(text);
    // Back to the text, with the same words selected inside the markers.
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(start + marker.length, start + marker.length + selected.length);
    });
  }

  return (
    <div>
      <div role="toolbar" aria-label="Formatting" className="flex items-center gap-0.5 border-b bg-muted/30 px-1.5 py-1">
        {FORMAT_ACTIONS.map(({ marker, label, icon: Icon }) => (
          <Button key={label} type="button" variant="ghost" size="icon-xs" onClick={() => wrapSelection(marker)} aria-label={label} title={label}>
            <Icon className="size-3" />
          </Button>
        ))}
        <span
          className={cn(
            "ml-auto pr-1 text-[0.6rem] tabular-nums",
            total >= TEMPLATE_LIMITS.text ? "font-medium text-destructive" : "text-muted-foreground",
          )}
          title="All the texts together"
        >
          {total}/{TEMPLATE_LIMITS.text}
        </span>
      </div>
      <textarea
        ref={ref}
        id={id}
        dir="auto"
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Text"
        className="field-sizing-content block max-h-80 min-h-24 w-full resize-none bg-transparent px-3 py-2 text-xs leading-relaxed outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

/** A file: click or drop to choose it; it goes up at once. */
export function MediaBlockEditor({
  id,
  type,
  file,
  uploading,
  error,
  fileHref,
  onFile,
}: {
  id: string;
  type: TemplateMediaType;
  file: TemplateFile | null;
  uploading: boolean;
  error: string | null;
  /** The route that serves a stored file. */
  fileHref: string;
  onFile: (file: File) => void;
}) {
  const rules = MEDIA_RULES[type];
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const Icon = BLOCK_ICONS[type];

  return (
    <div className="flex flex-col gap-2 p-3">
      <input
        ref={input}
        id={id}
        type="file"
        accept={rules.accept}
        hidden
        onChange={(event) => {
          const chosen = event.target.files?.[0];
          event.target.value = "";
          if (chosen) onFile(chosen);
        }}
      />
      {file ? (
        <div className="flex items-center gap-2.5 rounded-lg border bg-muted/20 p-2">
          {type === "IMAGE" ? (
            // eslint-disable-next-line @next/next/no-img-element -- a private file from our own route
            <img src={`${fileHref}?id=${file.id}`} alt="" className="size-10 shrink-0 rounded-md bg-muted object-cover" />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background">
              <Icon className="size-4" aria-hidden />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.7rem] font-medium">{file.name}</span>
            <span className="block text-[0.6rem] text-muted-foreground">{bytes(file.size)}</span>
          </span>
          <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => input.current?.click()} className={smallWhiteButton}>
            {uploading ? "Uploading…" : "Replace"}
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => input.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const dropped = event.dataTransfer.files?.[0];
            if (dropped) onFile(dropped);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-3 py-5 text-center transition-colors hover:bg-muted/40",
            dragging && "border-foreground/40 bg-muted/50",
          )}
        >
          {uploading ? <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden /> : <FileUp className="size-4 text-muted-foreground" aria-hidden />}
          <span className="text-[0.7rem] font-medium">{uploading ? "Uploading…" : "Click or drop a file"}</span>
          <span className="text-[0.6rem] text-muted-foreground">{rules.hint}</span>
        </button>
      )}
      {file && type === "AUDIO" ? <audio controls preload="metadata" src={`${fileHref}?id=${file.id}`} className="h-8 w-full" /> : null}
      {error ? <p role="alert" className="text-[0.65rem] text-destructive">{error}</p> : null}
    </div>
  );
}

/** A button: its text, and the link or the number when its kind needs one. */
export function ButtonBlockEditor({
  buttonType,
  label,
  value,
  onChange,
}: {
  buttonType: TemplateButtonType;
  label: string;
  value: string;
  onChange: (patch: { label?: string; value?: string }) => void;
}) {
  const kind = BUTTON_TYPES.find((item) => item.value === buttonType);
  return (
    <div className="grid gap-2 p-3 sm:grid-cols-2">
      <div className="relative">
        <Input
          aria-label="Button text"
          dir="auto"
          value={label}
          maxLength={TEMPLATE_LIMITS.buttonLabel}
          onChange={(event) => onChange({ label: event.target.value })}
          placeholder={buttonType === "URL" ? "See the offer" : buttonType === "PHONE" ? "Call us" : "I'm interested"}
          className="h-8 pr-12 text-xs"
        />
        <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[0.6rem] text-muted-foreground tabular-nums">
          {label.length}/{TEMPLATE_LIMITS.buttonLabel}
        </span>
      </div>
      {kind?.valueLabel ? (
        <Input
          aria-label={kind.valueLabel}
          type={buttonType === "URL" ? "url" : "tel"}
          value={value}
          maxLength={buttonType === "PHONE" ? TEMPLATE_LIMITS.phoneValue : TEMPLATE_LIMITS.buttonValue}
          onChange={(event) => onChange({ value: event.target.value })}
          placeholder={buttonType === "URL" ? "https://…" : "+212 6 12 34 56 78"}
          className="h-8 text-xs"
        />
      ) : (
        <p className="flex items-center text-[0.6rem] text-muted-foreground">The client&apos;s tap comes back as their answer.</p>
      )}
    </div>
  );
}

/** Adds a block, or says why it can't (on the wrapper: a disabled button gets no hover). */
export function AddButton({
  icon: Icon,
  label,
  count,
  refusal,
  onAdd,
}: {
  icon: LucideIcon;
  label: string;
  count: string | null;
  refusal: string | null;
  onAdd: () => void;
}) {
  return (
    <span title={refusal ?? undefined} className={cn("inline-flex", refusal && "cursor-not-allowed")}>
      <Button type="button" size="sm" variant="outline" onClick={onAdd} disabled={refusal !== null} className={smallWhiteButton}>
        <Icon className="size-3" />
        {label}
        {count ? <span className="text-muted-foreground tabular-nums">{count}</span> : null}
      </Button>
    </span>
  );
}

