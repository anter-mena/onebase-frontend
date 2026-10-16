import { Fragment } from "react";
import { ExternalLink, FileText, ImageIcon, Loader2, Mic, Phone, Play, Reply } from "lucide-react";
import { cn } from "cn";

import { bytes } from "@/lib/format";
import type { TemplateButtonType, TemplateFile, TemplateMediaType } from "@/lib/templates/types";

/**
 * What the client receives, drawn like the WhatsApp Inbox draws a chat: the
 * wallpaper, then one bubble per text or file in the template's order. A button
 * sits under the bubble before it; the footer is the grey line of the bubble
 * WhatsApp puts it on (the one with buttons, else the last text). Indicative:
 * the phone has the last word.
 *
 * <p>Used by the builder (files from `/templates/file`) and by the inbox's
 * Templates window (`/whatsapp-inbox/template-file`), hence `fileHref`.
 */

export type PreviewBlock =
  | { key: number; type: "TEXT"; text: string }
  /** `file` is null until one is chosen; `uploading` while it goes up. */
  | { key: number; type: TemplateMediaType; file: TemplateFile | null; uploading?: boolean }
  | { key: number; type: "BUTTON"; buttonType: TemplateButtonType; label: string };

type ContentBlock = Exclude<PreviewBlock, { type: "BUTTON" }>;
type ButtonBlock = Extract<PreviewBlock, { type: "BUTTON" }>;

/** One bubble and the buttons right after it; `content` is null for buttons placed before any bubble. */
type Bubble = { key: number; content: ContentBlock | null; buttons: ButtonBlock[] };

function toBubbles(blocks: readonly PreviewBlock[]) {
  const bubbles: Bubble[] = [];
  for (const block of blocks) {
    if (block.type !== "BUTTON") bubbles.push({ key: block.key, content: block, buttons: [] });
    else if (bubbles.length > 0) bubbles[bubbles.length - 1].buttons.push(block);
    else bubbles.push({ key: block.key, content: null, buttons: [block] });
  }
  return bubbles;
}

export const BUTTON_ICONS = { QUICK_REPLY: Reply, URL: ExternalLink, PHONE: Phone } as const;

export type MessageButton = { type: TemplateButtonType; label: string; value: string | null };

/**
 * The buttons of a message, as WhatsApp draws them: part of the bubble, under
 * its content, a thin line above each, the label in blue and centred. Shared by
 * this preview and the inbox's bubbles. With `links`, a URL button opens its
 * link; a quick reply is never clickable (only the client can tap it).
 */
export function MessageButtons({
  buttons,
  mine = false,
  links = false,
  className,
}: {
  buttons: readonly MessageButton[];
  /** On our own dark bubble in the inbox. */
  mine?: boolean;
  links?: boolean;
  className?: string;
}) {
  if (buttons.length === 0) return null;
  return (
    <div className={className}>
      {buttons.map((button, index) => {
        const Icon = BUTTON_ICONS[button.type];
        const rowClass = cn(
          "flex h-9 w-full items-center justify-center gap-1.5 border-t px-3 text-[0.7rem] font-medium",
          // The bubble's own text colour, not WhatsApp's blue (asked for 2026-10-16).
          mine ? "border-background/15 text-background" : "text-foreground",
        );
        const inner = (
          <>
            <Icon className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{button.label}</span>
          </>
        );
        return links && button.type === "URL" && button.value && /^https?:\/\//i.test(button.value) ? (
          <a key={index} href={button.value} target="_blank" rel="noopener noreferrer" className={cn(rowClass, "hover:underline")}>
            {inner}
          </a>
        ) : (
          <div key={index} className={rowClass} title={button.type === "PHONE" && button.value ? button.value : undefined}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

/** Bars of the voice note: fixed, so the server and the browser draw the same. */
const WAVEFORM = [0.35, 0.6, 0.9, 0.5, 0.75, 1, 0.6, 0.4, 0.8, 0.95, 0.55, 0.35, 0.7, 0.9, 0.45, 0.75, 1, 0.5, 0.4, 0.65, 0.85, 0.55, 0.35, 0.5];

// *bold*, _italic_, ~strike~ and ```mono```, as WhatsApp reads them. No nesting, like the phone.
const FORMATTING = /(```[\s\S]+?```|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;

export function WhatsAppText({ text }: { text: string }) {
  // split() with a capture group: the odd parts are the formatted ones.
  return text.split(FORMATTING).map((part, index) => {
    if (index % 2 === 0) return <Fragment key={index}>{part}</Fragment>;
    if (part.startsWith("```")) return <code key={index} className="font-mono text-[0.7rem]">{part.slice(3, -3)}</code>;
    const inner = part.slice(1, -1);
    if (part[0] === "*") return <strong key={index} className="font-semibold">{inner}</strong>;
    if (part[0] === "_") return <em key={index}>{inner}</em>;
    return <s key={index}>{inner}</s>;
  });
}

function Waiting({ uploading, label }: { uploading?: boolean; label: string }) {
  return uploading ? (
    <span className="inline-flex items-center gap-1"><Loader2 className="size-3 animate-spin" aria-hidden /> Uploading…</span>
  ) : (
    <>{label}</>
  );
}

function BubbleContent({ block, fileHref }: { block: ContentBlock; fileHref: string }) {
  if (block.type === "TEXT") {
    return (
      <p dir="auto" className={cn("px-2.5 pt-2 whitespace-pre-wrap break-words", !block.text.trim() && "text-muted-foreground italic")}>
        {block.text.trim() ? <WhatsAppText text={block.text} /> : "Empty text"}
      </p>
    );
  }

  if (block.type === "IMAGE") {
    return block.file ? (
      // eslint-disable-next-line @next/next/no-img-element -- a private file from our own route
      <img src={`${fileHref}?id=${block.file.id}`} alt={block.file.name} className="max-h-72 min-h-24 w-full rounded-xl bg-muted/40 object-cover" />
    ) : (
      <div className="flex aspect-[1.6/1] w-full flex-col items-center justify-center gap-1 rounded-xl bg-muted text-[0.6rem] text-muted-foreground">
        <ImageIcon className="size-5" aria-hidden />
        <Waiting uploading={block.uploading} label="No photo chosen" />
      </div>
    );
  }

  if (block.type === "DOCUMENT") {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-2.5 py-2">
        <FileText className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.7rem] font-medium">{block.file?.name ?? "document.pdf"}</span>
          <span className="block text-[0.6rem] text-muted-foreground">
            {block.file ? `PDF · ${bytes(block.file.size)}` : <Waiting uploading={block.uploading} label="No file chosen" />}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="px-1.5 pt-1">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
          <Play className="ml-0.5 size-3.5 fill-current" aria-hidden />
        </span>
        <span className="flex h-6 min-w-0 flex-1 items-center gap-[2px]" aria-hidden>
          {WAVEFORM.map((height, index) => (
            <span key={index} className="min-w-0 flex-1 rounded-full bg-foreground/25" style={{ height: `${height * 100}%` }} />
          ))}
        </span>
        <Mic className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <p className="mt-1 truncate pl-11 text-[0.6rem] text-muted-foreground">
        {block.file ? `${block.file.name} · ${bytes(block.file.size)}` : <Waiting uploading={block.uploading} label="No audio chosen" />}
      </p>
    </div>
  );
}

export function TemplatePreview({
  blocks,
  footer,
  fileHref,
  className,
}: {
  blocks: readonly PreviewBlock[];
  footer: string;
  /** The route that serves a stored file, as `${fileHref}?id=…`. */
  fileHref: string;
  className?: string;
}) {
  const bubbles = toBubbles(blocks);
  // Where WhatsApp shows the footer: on the message with buttons, else as the last line of the last text.
  const footerBubble =
    bubbles.findLast((bubble) => bubble.content && bubble.buttons.length > 0) ??
    bubbles.findLast((bubble) => bubble.content?.type === "TEXT") ??
    bubbles.findLast((bubble) => bubble.content !== null);

  return (
    <div className={cn("relative min-h-0 overflow-hidden rounded-xl border bg-muted/30", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-muted-foreground opacity-[0.12]"
        style={{
          WebkitMaskImage: 'url("/whatsapp-chat-wallpaper.webp")',
          WebkitMaskRepeat: "repeat",
          WebkitMaskSize: "540px 960px",
          maskImage: 'url("/whatsapp-chat-wallpaper.webp")',
          maskRepeat: "repeat",
          maskSize: "540px 960px",
        }}
      />
      <div className="relative z-10 flex h-full flex-col gap-2 overflow-y-auto px-3 py-4 [scrollbar-width:thin]" aria-label="Message preview">
        <div className="mb-1 flex justify-center">
          <span className="rounded-full border bg-background px-2.5 py-1 text-[0.6rem] text-muted-foreground shadow-sm">Today</span>
        </div>

        {bubbles.length === 0 ? (
          <div className="max-w-[85%] self-start rounded-2xl rounded-bl-md border bg-background px-3.5 py-2.5 text-xs text-muted-foreground italic shadow-sm">
            Your message appears here.
          </div>
        ) : null}

        {bubbles.map((bubble) => {
          const showFooter = bubble === footerBubble && footer.trim();
          const content = bubble.content;
          return (
            <div
              key={bubble.key}
              className="w-[85%] max-w-72 shrink-0 self-start overflow-hidden rounded-2xl rounded-bl-md border bg-background text-xs leading-relaxed shadow-sm"
            >
              {content ? (
                <div className={content.type === "TEXT" ? "pb-2" : "p-1 pb-1.5"}>
                  <BubbleContent block={content} fileHref={fileHref} />
                  {showFooter ? (
                    <p dir="auto" className="mt-1 px-2.5 text-[0.65rem] text-muted-foreground">{footer}</p>
                  ) : null}
                </div>
              ) : null}
              <MessageButtons
                buttons={bubble.buttons.map((button) => ({ type: button.buttonType, label: button.label.trim() || "Button", value: null }))}
                className={content ? undefined : "[&>*:first-child]:border-t-0"}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
