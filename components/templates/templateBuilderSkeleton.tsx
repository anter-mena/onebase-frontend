import type { ComponentType, ReactNode } from "react";
import { Bold, ChevronDown, ChevronUp, Code, GripVertical, Italic, Strikethrough, Type, X } from "lucide-react";

import { ButtonSkeleton, Line, PageSkeleton } from "@/components/loading/pageSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { TEMPLATE_LIMITS } from "@/lib/templates/rules";

/**
 * New / Edit template while it loads — templateBuilder.tsx, piece by piece at
 * its real sizes:
 *
 * <ul>
 *   <li>Details: an InfoCard (clients/infoCard.tsx: `h-9` header strip, `p-4` body) with
 *       Name, Language and Status side by side, each an `h-8` control;</li>
 *   <li>Message: the add-block toolbar (`h-7` buttons), the blocks — each a row with its
 *       grip rail, its `h-8` header, the formatting bar and a `min-h-24` text area
 *       (templateBlocks.tsx) — the help paragraph, and the Footer field;</li>
 *   <li>the WhatsApp preview: its frame, "Today", the bubbles, the caption.</li>
 * </ul>
 *
 * <p>Labels, headings and the help text are the real words; what the template
 * holds is grey. `blocks`: a new template starts with one empty text; an edited
 * one has its own, so two are drawn.
 */
export function TemplateBuilderSkeleton({ title, blocks }: { title: ReactNode; blocks: number }) {
  return (
    <PageSkeleton
      back={{ href: "/templates", label: "Templates" }}
      title={title}
      description="A message to send from the WhatsApp Inbox: texts, photos, a PDF or an audio, and buttons, in the order you choose."
      actions={
        <>
          <ButtonSkeleton className="w-16" />
          <ButtonSkeleton className="w-28" />
        </>
      }
    >
      <div className="grid h-full min-h-0 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="flex min-w-0 flex-col gap-4 p-4 lg:min-h-0 lg:overflow-hidden">
          <InfoCard title="Details" className="shrink-0" contentClassName="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
            <Field label="Name" counter={`0/${TEMPLATE_LIMITS.name}`}>
              <Skeleton className="h-8 w-full rounded-lg" />
            </Field>
            <Field label="Language">
              <Skeleton className="h-8 w-full rounded-lg" />
            </Field>
            <Field label="Status">
              <span className="flex h-8 items-center gap-2">
                <span className="h-[14px] w-[24px] rounded-full bg-muted" />
                <Line className="text-[0.65rem] font-medium" width="w-10" />
              </span>
            </Field>
          </InfoCard>

          <InfoCard
            title="Message"
            action={<Line className="text-[0.6rem]" width="w-16" />}
            className="shrink-0 lg:min-h-0 lg:flex-1 lg:shrink"
            contentClassName="flex min-h-0 flex-1 flex-col"
          >
            {/* Text, Photo, PDF, Audio | Button. */}
            <div className="flex shrink-0 flex-wrap items-center justify-center gap-1.5 border-b px-4 py-3">
              {["w-14", "w-20", "w-16", "w-20"].map((width, index) => (
                <ButtonSkeleton key={index} className={width} />
              ))}
              <span aria-hidden className="mx-0.5 h-4 w-px bg-border" />
              <ButtonSkeleton className="w-24" />
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 [scrollbar-gutter:stable]">
              <ol className="flex flex-col gap-2">
                {Array.from({ length: blocks }, (_, index) => (
                  <TextBlock key={index} />
                ))}
              </ol>
              <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
                Drag a block by its grip, or use the arrows, to change the order. One kind of attachment per template: up to 2
                photos, or 1 PDF, or 1 audio, 4 MB each. A button shows under the block before it: {TEMPLATE_LIMITS.buttons} at
                most, 1 call at most. The texts share {TEMPLATE_LIMITS.text} characters. Format with *bold*, _italic_, ~strike~
                and ```mono```.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-2 border-t px-4 py-3">
              <FieldLabel label="Footer" counter={`0/${TEMPLATE_LIMITS.footer}`} />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          </InfoCard>
        </div>

        <aside className="flex min-h-0 min-w-0 flex-col gap-2 border-t bg-muted/10 p-4 lg:border-t-0 lg:border-l">
          <p className="text-[0.6rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">WhatsApp preview</p>
          {/* The preview's frame (templatePreview.tsx), "Today", and the message as white bubbles. */}
          <div className="relative h-[30rem] min-h-0 overflow-hidden rounded-xl border bg-muted/30 lg:h-auto lg:flex-1">
            <div className="flex h-full flex-col gap-2 px-3 py-4">
              <div className="mb-1 flex justify-center">
                <span className="rounded-full border bg-background px-2.5 py-1 text-[0.6rem] text-muted-foreground shadow-sm">Today</span>
              </div>
              <div className="flex w-[85%] flex-col gap-1.5 self-start rounded-2xl rounded-bl-md border bg-background px-3.5 py-2.5 shadow-sm">
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="h-2.5 w-5/6" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
              <div className="flex w-[60%] flex-col gap-1.5 self-start rounded-2xl rounded-bl-md border bg-background px-3.5 py-2.5 shadow-sm">
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="h-2.5 w-2/3" />
              </div>
            </div>
          </div>
          <p className="text-[0.6rem] text-muted-foreground">Indicative: the client&apos;s phone has the last word.</p>
        </aside>
      </div>
    </PageSkeleton>
  );
}

/** The InfoCard frame (clients/infoCard.tsx): the `h-9` muted header strip, then the body. */
function InfoCard({
  title,
  action,
  className,
  contentClassName,
  children,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={`flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card ${className ?? ""}`}>
      <header className="flex h-9 shrink-0 items-center justify-between gap-2 border-b bg-muted/50 px-4">
        <h3 className="text-[0.6rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{title}</h3>
        {action}
      </header>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}

/** A field label as the builder draws it: `text-xs`, and the character count on the right. */
function FieldLabel({ label, counter }: { label: string; counter?: string }) {
  return (
    <span className="flex w-full items-center gap-2 text-xs leading-snug font-medium">
      {label}
      {counter ? <span className="ml-auto text-[0.6rem] font-normal text-muted-foreground tabular-nums">{counter}</span> : null}
    </span>
  );
}

function Field({ label, counter, children }: { label: string; counter?: string; children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <FieldLabel label={label} counter={counter} />
      {children}
    </div>
  );
}

const FORMAT_ICONS: ComponentType<{ className?: string }>[] = [Bold, Italic, Strikethrough, Code];

/**
 * A text block (templateBlocks.tsx): the grip rail on the left, then the `h-8`
 * header, the formatting bar, and the text area at its `min-h-24`, the text grey.
 */
function TextBlock() {
  return (
    <li className="relative flex items-stretch overflow-hidden rounded-xl border bg-background">
      <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 border-r bg-muted/40 px-0.5 py-1 text-muted-foreground">
        <span className="flex size-5 items-center justify-center"><ChevronUp className="size-3" /></span>
        <span className="flex size-5 items-center justify-center"><GripVertical className="size-3.5" /></span>
        <span className="flex size-5 items-center justify-center"><ChevronDown className="size-3" /></span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex h-8 items-center gap-2 border-b px-3">
          <Type className="size-3.5 text-muted-foreground" aria-hidden />
          <span className="text-[0.7rem] font-medium">Text</span>
          <X className="ml-auto size-3 text-muted-foreground" aria-hidden />
        </div>
        <div className="flex items-center gap-0.5 border-b bg-muted/30 px-1.5 py-1 text-muted-foreground">
          {FORMAT_ICONS.map((Icon, index) => (
            <span key={index} className="flex size-6 items-center justify-center">
              <Icon className="size-3" />
            </span>
          ))}
        </div>
        <div className="flex min-h-24 flex-col gap-1.5 px-3 py-2">
          <Line className="text-xs leading-relaxed" width="w-5/6" />
          <Line className="text-xs leading-relaxed" width="w-2/3" />
        </div>
      </div>
    </li>
  );
}
