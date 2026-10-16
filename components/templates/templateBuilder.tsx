"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Reorder } from "motion/react";
import { ArrowLeft, ChevronDown, MousePointerClick } from "lucide-react";
import { cn } from "cn";

import { createTemplate, updateTemplate } from "@/app/(private)/templates/actions";
import { InfoCard } from "@/components/clients/infoCard";
import { LeaveGuard } from "@/components/templates/leaveGuard";
import {
  AddButton,
  BLOCK_ICONS,
  BlockHeader,
  ButtonBlockEditor,
  MediaBlockEditor,
  ReorderRow,
  TextBlockEditor,
  smallWhiteButton,
} from "@/components/templates/templateBlocks";
import { BUTTON_ICONS, TemplatePreview, type PreviewBlock } from "@/components/templates/templatePreview";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  BLOCK_LABELS,
  BUTTON_TYPES,
  MEDIA_RULES,
  TEMPLATE_LANGUAGES,
  TEMPLATE_LIMITS,
  addBlockRefusal,
  addButtonRefusal,
  buttonTypeLabel,
  fileRefusal,
  isMediaType,
  templateProblem,
} from "@/lib/templates/rules";
import type {
  MessageTemplate,
  TemplateBlockType,
  TemplateButtonType,
  TemplateFile,
  TemplateInput,
  TemplateLanguage,
  TemplateMediaType,
} from "@/lib/templates/types";

/**
 * The template builder: Details and Message on the left, the WhatsApp preview
 * on the right, following every keystroke.
 *
 * <p>The message is a list of blocks in the order the client receives them —
 * texts, files (one kind per template) and buttons, a button sitting under the
 * block before it. Files go up the moment they are chosen (through the
 * `/templates/file` route: server actions are limited to 2 MB), so Save only
 * sends their ids. The rules are `lib/templates/rules.ts`, checked as you go;
 * the backend checks them again and its sentence is shown if it refuses.
 */

const FILE_HREF = "/templates/file";

type DraftBlock =
  | { key: number; type: "TEXT"; text: string }
  | { key: number; type: TemplateMediaType; file: TemplateFile | null; uploading: boolean; error: string | null }
  | { key: number; type: "BUTTON"; buttonType: TemplateButtonType; label: string; value: string };

type Draft = {
  name: string;
  language: TemplateLanguage;
  active: boolean;
  footer: string;
  blocks: DraftBlock[];
};

function draftOf(template: MessageTemplate | null): Draft {
  if (!template) {
    // A new template is on by default, and most messages start with a text.
    return { name: "", language: "EN", active: true, footer: "", blocks: [{ key: 1, type: "TEXT", text: "" }] };
  }
  return {
    name: template.name,
    language: template.language,
    active: template.active,
    footer: template.footer,
    blocks: template.blocks.map((block, index): DraftBlock => {
      const key = index + 1;
      if (block.type === "TEXT") return { key, type: "TEXT", text: block.text };
      if (block.type === "BUTTON") return { key, type: "BUTTON", buttonType: block.buttonType, label: block.label, value: block.value ?? "" };
      return { key, type: block.type, file: block.file, uploading: false, error: null };
    }),
  };
}

/** What Save sends; also what "changed" is measured on, so typing then erasing is no change. */
function inputOf(draft: Draft): TemplateInput {
  return {
    name: draft.name.trim(),
    language: draft.language,
    active: draft.active,
    footer: draft.footer.trim(),
    blocks: draft.blocks.map((block) => {
      if (block.type === "TEXT") return { type: "TEXT", text: block.text };
      if (block.type === "BUTTON") {
        return {
          type: "BUTTON",
          buttonType: block.buttonType,
          label: block.label.trim(),
          value: block.buttonType === "QUICK_REPLY" ? null : block.value.trim(),
        };
      }
      return { type: block.type, fileId: block.file?.id };
    }),
  };
}

/** The same list with one item moved by one place. */
function moved<T>(list: readonly T[], index: number, offset: -1 | 1): T[] {
  const target = index + offset;
  if (target < 0 || target >= list.length) return [...list];
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

const ADDABLE: readonly Exclude<TemplateBlockType, "BUTTON">[] = ["TEXT", "IMAGE", "DOCUMENT", "AUDIO"];

export function TemplateBuilder({ template }: { template: MessageTemplate | null }) {
  const router = useRouter();
  const [initial] = useState(() => draftOf(template));
  const [draft, setDraft] = useState<Draft>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const input = inputOf(draft);
  const dirty = JSON.stringify(input) !== JSON.stringify(inputOf(initial));
  const uploading = draft.blocks.some((block) => isMediaType(block.type) && "uploading" in block && block.uploading);
  const problem = templateProblem(input);
  const textTotal = draft.blocks.reduce((total, block) => total + (block.type === "TEXT" ? block.text.length : 0), 0);
  const buttonCount = draft.blocks.filter((block) => block.type === "BUTTON").length;
  const buttonsFull = buttonCount >= TEMPLATE_LIMITS.buttons;

  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));
  const setBlocks = (blocks: DraftBlock[]) => update({ blocks });

  // By key, on the latest state: an upload finishes after other changes, maybe after the block was removed.
  function patchBlock(key: number, patch: Partial<DraftBlock>) {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) => (block.key === key ? ({ ...block, ...patch } as DraftBlock) : block)),
    }));
  }

  const nextKey = () => Math.max(0, ...draft.blocks.map((block) => block.key)) + 1;

  function addBlock(type: Exclude<TemplateBlockType, "BUTTON">) {
    const key = nextKey();
    setBlocks([
      ...draft.blocks,
      type === "TEXT" ? { key, type, text: "" } : { key, type, file: null, uploading: false, error: null },
    ]);
  }

  function addButton(buttonType: TemplateButtonType) {
    setBlocks([...draft.blocks, { key: nextKey(), type: "BUTTON", buttonType, label: "", value: "" }]);
  }

  async function upload(key: number, type: TemplateMediaType, file: File) {
    const refusal = fileRefusal(type, file);
    if (refusal) {
      patchBlock(key, { error: refusal });
      return;
    }
    patchBlock(key, { uploading: true, error: null });
    try {
      const form = new FormData();
      form.append("file", file, file.name);
      const response = await fetch(FILE_HREF, { method: "POST", body: form });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        patchBlock(key, { uploading: false, error: body?.message ?? "The file could not be uploaded." });
        return;
      }
      patchBlock(key, { uploading: false, file: body as TemplateFile });
    } catch {
      patchBlock(key, { uploading: false, error: "Could not reach the server. Please try again." });
    }
  }

  /** "Photo 2", "Text", "Button 1 · Link": what each row is called. */
  function blockTitle(block: DraftBlock) {
    const sameType = draft.blocks.filter((item) => item.type === block.type);
    const title = sameType.length > 1 ? `${BLOCK_LABELS[block.type]} ${sameType.indexOf(block) + 1}` : BLOCK_LABELS[block.type];
    return block.type === "BUTTON" ? `${title} · ${buttonTypeLabel(block.buttonType)}` : title;
  }

  function save() {
    if (!dirty || problem || saving || uploading) return;
    setError(null);
    startSaving(async () => {
      const result = template ? await updateTemplate(template.id, input) : await createTemplate(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/templates");
      router.refresh();
    });
  }

  const previewBlocks: PreviewBlock[] = draft.blocks.map((block) => {
    if (block.type === "TEXT") return { key: block.key, type: "TEXT", text: block.text };
    if (block.type === "BUTTON") return { key: block.key, type: "BUTTON", buttonType: block.buttonType, label: block.label };
    return { key: block.key, type: block.type, file: block.file, uploading: block.uploading };
  });

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <Link
            href="/templates"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" aria-hidden />
            Templates
          </Link>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">{template ? template.name : "New template"}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            A message to send from the WhatsApp Inbox: texts, photos, a PDF or an audio, and buttons, in the order you choose.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:ml-auto">
          {error ? (
            <p role="alert" className="max-w-72 text-right text-[0.65rem] text-destructive">
              {error}
            </p>
          ) : dirty && problem ? (
            // What still stops Save, so a grey button is never a mystery.
            <p className="max-w-72 text-right text-[0.65rem] text-muted-foreground">{problem}</p>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            render={<Link href="/templates" />}
            nativeButton={false}
            className={cn(whiteStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={save}
            disabled={!dirty || problem !== null || saving || uploading}
            className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}
          >
            {saving ? "Saving…" : template ? "Save changes" : "Save template"}
          </Button>
        </div>
      </header>

      <section
        className="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border bg-background"
        aria-label="Template builder"
      >
        {/* Side by side (lg), nothing scrolls but the Message card's list and the preview;
            stacked below `lg`, the whole section scrolls. */}
        <div className="grid h-full min-h-0 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden xl:grid-cols-[minmax(0,1fr)_26rem]">
          {/* The column itself never scrolls: Details keeps its height (shrink-0) and the
              Message card takes the rest, scrolling only its list of blocks. */}
          <div className="flex min-w-0 flex-col gap-4 p-4 lg:min-h-0 lg:overflow-hidden">
            <InfoCard title="Details" className="shrink-0" contentClassName="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
              <Field>
                <FieldLabel htmlFor="template-name" className="text-xs">
                  Name
                  <span className="ml-auto text-[0.6rem] font-normal text-muted-foreground tabular-nums">
                    {draft.name.length}/{TEMPLATE_LIMITS.name}
                  </span>
                </FieldLabel>
                <Input
                  id="template-name"
                  value={draft.name}
                  maxLength={TEMPLATE_LIMITS.name}
                  onChange={(event) => update({ name: event.target.value })}
                  placeholder="e.g. Trial ending"
                  className="h-8 text-xs"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="template-language" className="text-xs">Language</FieldLabel>
                <Select value={draft.language} onValueChange={(value) => { if (value) update({ language: value as TemplateLanguage }); }}>
                  <SelectTrigger id="template-language" className="h-8 w-full text-xs">
                    <SelectValue>
                      {(value: string | null) => TEMPLATE_LANGUAGES.find((item) => item.value === value)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {TEMPLATE_LANGUAGES.map((item) => (
                      <SelectItem key={item.value} value={item.value} className="text-xs">{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="template-active" className="text-xs">Status</FieldLabel>
                <span className="flex h-8 items-center gap-2" title="An inactive template can't be sent from the inbox.">
                  <Switch id="template-active" size="sm" checked={draft.active} onCheckedChange={(checked) => update({ active: checked })} />
                  <span className={cn("text-[0.65rem] font-medium", draft.active ? "text-foreground" : "text-muted-foreground")}>
                    {draft.active ? "Active" : "Inactive"}
                  </span>
                </span>
              </Field>
            </InfoCard>

            <InfoCard
              title="Message"
              action={
                <span className={cn("text-[0.6rem] tabular-nums", textTotal >= TEMPLATE_LIMITS.text ? "font-medium text-destructive" : "text-muted-foreground")}>
                  Text {textTotal}/{TEMPLATE_LIMITS.text}
                </span>
              }
              className="shrink-0 lg:min-h-0 lg:flex-1 lg:shrink"
              contentClassName="flex min-h-0 flex-1 flex-col p-0!"
            >
              {/* Fixed at the top of the card: adding never means scrolling back up. */}
              <div className="flex shrink-0 flex-wrap items-center justify-center gap-1.5 border-b px-4 py-3">
                {ADDABLE.map((type) => (
                  <AddButton
                    key={type}
                    icon={BLOCK_ICONS[type]}
                    label={BLOCK_LABELS[type]}
                    count={type === "TEXT" ? null : `${draft.blocks.filter((block) => block.type === type).length}/${MEDIA_RULES[type].max}`}
                    refusal={addBlockRefusal(draft.blocks, type)}
                    onAdd={() => addBlock(type)}
                  />
                ))}
                <span aria-hidden className="mx-0.5 h-4 w-px bg-border" />
                {/* The three kinds of button share one menu. */}
                <span
                  title={buttonsFull ? `${TEMPLATE_LIMITS.buttons} buttons at most.` : undefined}
                  className={cn("inline-flex", buttonsFull && "cursor-not-allowed")}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      disabled={buttonsFull}
                      render={<Button type="button" size="sm" variant="outline" className={smallWhiteButton} />}
                    >
                      <MousePointerClick className="size-3" />
                      Button
                      <span className="text-muted-foreground tabular-nums">{buttonCount}/{TEMPLATE_LIMITS.buttons}</span>
                      <ChevronDown className="size-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-auto min-w-44 whitespace-nowrap">
                      {BUTTON_TYPES.map(({ value, label }) => {
                        const Icon = BUTTON_ICONS[value];
                        const refusal = addButtonRefusal(draft.blocks, value);
                        return (
                          <DropdownMenuItem key={value} disabled={refusal !== null} className="text-xs" onClick={() => addButton(value)}>
                            <Icon className="size-3.5" />
                            {label}
                            {refusal ? <span className="ml-auto pl-3 text-[0.6rem] text-muted-foreground">{refusal}</span> : null}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </span>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 [scrollbar-gutter:stable]">
                {draft.blocks.length > 0 ? (
                  <Reorder.Group as="ol" axis="y" values={draft.blocks} onReorder={setBlocks} className="flex flex-col gap-2">
                    {draft.blocks.map((block, index) => {
                      const title = blockTitle(block);
                      return (
                        <ReorderRow
                          key={block.key}
                          value={block}
                          index={index}
                          count={draft.blocks.length}
                          label={title}
                          onMove={(offset) => setBlocks(moved(draft.blocks, index, offset))}
                        >
                          <BlockHeader
                            icon={block.type === "BUTTON" ? BUTTON_ICONS[block.buttonType] : BLOCK_ICONS[block.type]}
                            title={title}
                            onRemove={() => setBlocks(draft.blocks.filter((item) => item.key !== block.key))}
                          />
                          {block.type === "TEXT" ? (
                            <TextBlockEditor
                              id={`template-block-${block.key}`}
                              value={block.text}
                              // What the other texts leave of the shared budget.
                              maxLength={TEMPLATE_LIMITS.text - (textTotal - block.text.length)}
                              total={textTotal}
                              onChange={(text) => patchBlock(block.key, { text })}
                              placeholder={index === 0 ? "Hi! Your trial ends *tomorrow*. Renew now to keep watching." : "Your text…"}
                            />
                          ) : block.type === "BUTTON" ? (
                            <ButtonBlockEditor
                              buttonType={block.buttonType}
                              label={block.label}
                              value={block.value}
                              onChange={(patch) => patchBlock(block.key, patch)}
                            />
                          ) : (
                            <MediaBlockEditor
                              id={`template-block-${block.key}`}
                              type={block.type}
                              file={block.file}
                              uploading={block.uploading}
                              error={block.error}
                              fileHref={FILE_HREF}
                              onFile={(file) => void upload(block.key, block.type as TemplateMediaType, file)}
                            />
                          )}
                        </ReorderRow>
                      );
                    })}
                  </Reorder.Group>
                ) : (
                  <p className="rounded-xl border border-dashed px-4 py-6 text-center text-[0.7rem] text-muted-foreground">
                    The message is empty: add a text, a photo, a PDF, an audio or a button.
                  </p>
                )}

                <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
                  Drag a block by its grip, or use the arrows, to change the order. One kind of attachment per template: up to 2
                  photos, or 1 PDF, or 1 audio, 4 MB each. A button shows under the block before it: {TEMPLATE_LIMITS.buttons} at
                  most, 1 call at most. The texts share {TEMPLATE_LIMITS.text} characters. Format with *bold*, _italic_, ~strike~
                  and ```mono```.
                </p>
              </div>

              <Field className="shrink-0 border-t px-4 py-3">
                <FieldLabel htmlFor="template-footer" className="text-xs">
                  Footer
                  <span className="ml-auto text-[0.6rem] font-normal text-muted-foreground tabular-nums">
                    {draft.footer.length}/{TEMPLATE_LIMITS.footer}
                  </span>
                </FieldLabel>
                <Input
                  id="template-footer"
                  dir="auto"
                  value={draft.footer}
                  maxLength={TEMPLATE_LIMITS.footer}
                  onChange={(event) => update({ footer: event.target.value })}
                  placeholder="Optional, e.g. Reply STOP to stop these messages"
                  className="h-8 text-xs"
                />
              </Field>
            </InfoCard>
          </div>

          <aside aria-label="WhatsApp preview" className="flex min-h-0 min-w-0 flex-col gap-2 border-t bg-muted/10 p-4 lg:border-t-0 lg:border-l">
            <p className="text-[0.6rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">WhatsApp preview</p>
            <TemplatePreview blocks={previewBlocks} footer={draft.footer} fileHref={FILE_HREF} className="h-[30rem] lg:h-auto lg:flex-1" />
            <p className="text-[0.6rem] text-muted-foreground">Indicative: the client&apos;s phone has the last word.</p>
          </aside>
        </div>
      </section>

      <LeaveGuard when={dirty && !saving} />
    </div>
  );
}
