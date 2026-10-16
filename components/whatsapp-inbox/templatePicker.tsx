"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "cn";

import { listSendableTemplates, sendSavedTemplate } from "@/app/(private)/whatsapp-inbox/actions";
import { firstText } from "@/components/templates/templatesTable";
import { TemplatePreview, type PreviewBlock } from "@/components/templates/templatePreview";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TEMPLATE_LANGUAGES, languageLabel } from "@/lib/templates/rules";
import type { MessageTemplate, TemplateLanguage } from "@/lib/templates/types";
import type { WaConversation } from "@/lib/whatsapp/types";

/**
 * The composer's Templates window: the active templates (from the Templates
 * page), a preview of the chosen one, and Send. Sent as ordinary messages, one
 * after the other, so only within the 24-hour window — the backend refuses
 * otherwise (409), and Send says why before that.
 */

const FILE_HREF = "/whatsapp-inbox/template-file";

type Loaded = { state: "loading" } | { state: "failed"; error: string } | { state: "ready"; templates: MessageTemplate[] };

function previewOf(template: MessageTemplate): PreviewBlock[] {
  return template.blocks.map((block, index) => {
    if (block.type === "TEXT") return { key: index, type: "TEXT", text: block.text };
    if (block.type === "BUTTON") return { key: index, type: "BUTTON", buttonType: block.buttonType, label: block.label };
    return { key: index, type: block.type, file: block.file };
  });
}

export function TemplatePicker({
  conversation,
  open,
  onOpenChange,
}: {
  conversation: WaConversation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [loaded, setLoaded] = useState<Loaded>({ state: "loading" });
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<TemplateLanguage | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();

  // Asked each time the window opens, so a template saved a minute ago is there.
  useEffect(() => {
    if (!open) return;
    let current = true;
    listSendableTemplates().then((result) => {
      if (!current) return;
      setLoaded(result.ok ? { state: "ready", templates: result.templates } : { state: "failed", error: result.error });
    });
    return () => {
      current = false;
    };
  }, [open]);

  const templates = useMemo(() => (loaded.state === "ready" ? loaded.templates : []), [loaded]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return templates.filter(
      (template) =>
        (language === "ALL" || template.language === language) &&
        (!needle || template.name.toLowerCase().includes(needle) || firstText(template).toLowerCase().includes(needle)),
    );
  }, [language, query, templates]);
  const selected = filtered.find((template) => template.id === selectedId) ?? filtered[0] ?? null;

  function changeOpen(next: boolean) {
    // Not while sending: the result would have nowhere to show.
    if (sending) return;
    if (!next) {
      setError(null);
      setLoaded({ state: "loading" });
    }
    onOpenChange(next);
  }

  function send() {
    if (!selected || sending || !conversation.windowOpen) return;
    const template = selected;
    setError(null);
    startSending(async () => {
      const result = await sendSavedTemplate(conversation.id, template.id);
      router.refresh();
      if (!result.ok) {
        // It stops at the first piece that fails: the ones before it are already sent (the chat shows them).
        setError(result.windowClosed ? result.error : `${result.error} Anything before it was already sent.`);
        return;
      }
      setLoaded({ state: "loading" });
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-3xl gap-3 overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-sm">Send a template</DialogTitle>
          <DialogDescription className="text-xs">
            To {conversation.name}. Each text, file and button arrives as its own WhatsApp message, in order.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 gap-3 md:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="flex min-h-0 min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-40 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search templates"
                  aria-label="Search templates"
                  className="h-8 bg-muted/30 pl-8 text-xs"
                />
              </div>
              <div role="group" aria-label="Filter by language" className="inline-flex shrink-0 rounded-lg border border-border/60 bg-muted p-0.5">
                {[{ value: "ALL" as const, label: "All" }, ...TEMPLATE_LANGUAGES].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setLanguage(option.value)}
                    aria-pressed={language === option.value}
                    title={option.value === "ALL" ? "All languages" : option.label}
                    className={cn(
                      "inline-flex h-6 items-center justify-center rounded-md border border-transparent px-2 text-[0.65rem] font-medium transition-colors",
                      language === option.value ? "border-border bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.value === "ALL" ? "All" : option.value}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-72 overflow-y-auto rounded-xl border p-1.5 md:h-[24rem]" role="listbox" aria-label="Templates">
              {loaded.state === "loading" ? (
                <p className="px-3 py-8 text-center text-[0.7rem] text-muted-foreground">Loading templates…</p>
              ) : loaded.state === "failed" ? (
                <p role="alert" className="px-3 py-8 text-center text-[0.7rem] text-destructive">{loaded.error}</p>
              ) : filtered.length === 0 ? (
                <p className="px-3 py-8 text-center text-[0.7rem] text-muted-foreground">
                  {templates.length === 0 ? "No active templates yet. An Admin writes them on the Templates page." : "No templates found."}
                </p>
              ) : (
                <div className="space-y-1">
                  {filtered.map((template) => {
                    const active = template.id === selected?.id;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => setSelectedId(template.id)}
                        className={cn(
                          "flex w-full flex-col items-start rounded-lg border border-transparent px-2.5 py-2 text-left transition-colors",
                          active ? "border-border bg-muted/60" : "hover:bg-muted/40",
                        )}
                      >
                        <span className="flex w-full items-center gap-2">
                          <span className="truncate text-xs font-semibold">{template.name}</span>
                          <span className="ml-auto shrink-0 rounded border px-1 text-[0.55rem] text-muted-foreground" title={languageLabel(template.language)}>
                            {template.language}
                          </span>
                        </span>
                        <span className="mt-0.5 text-[0.6rem] text-muted-foreground">{template.summary}</span>
                        {firstText(template) ? (
                          <span className="mt-0.5 line-clamp-1 w-full text-[0.65rem] text-muted-foreground">{firstText(template)}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <TemplatePreview
            blocks={selected ? previewOf(selected) : []}
            footer={selected?.footer ?? ""}
            fileHref={FILE_HREF}
            className="h-80 md:h-auto"
          />
        </div>

        <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center">
          <p
            role={error ? "alert" : undefined}
            className={cn("min-w-0 flex-1 text-[0.65rem]", error ? "text-destructive" : "text-muted-foreground")}
          >
            {error ??
              (!conversation.windowOpen
                ? `More than 24 hours since ${conversation.name}'s last message: templates can be sent again once they answer.`
                : sending
                  ? "Sending each piece in turn: this can take a few seconds."
                  : "")}
          </p>
          <div className="flex shrink-0 items-center justify-end gap-2">
            <DialogClose
              disabled={sending}
              render={<Button size="sm" variant="outline" className="h-7 px-3 text-[0.65rem] font-normal" />}
            >
              Cancel
            </DialogClose>
            <Button
              type="button"
              size="sm"
              onClick={send}
              disabled={!selected || sending || !conversation.windowOpen}
              className={cn(blackStyle.button, "h-7 px-3! py-0! text-[0.65rem]! font-normal! disabled:opacity-50")}
            >
              {sending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
