"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { cn } from "cn";

import { setTemplateActive } from "@/app/(private)/templates/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { showTopBanner } from "@/components/ui/topBanner";
import { utcStamp } from "@/lib/format";
import { languageLabel } from "@/lib/templates/rules";
import type { MessageTemplate, TemplateBlockType } from "@/lib/templates/types";
import { BLOCK_ICONS } from "@/components/templates/templateBlocks";
import { useLockedTransition } from "@/components/app-shell/actionLock";

/**
 * The Templates list: the Users table's toolbar and look, without paging — there
 * are a handful of templates, not hundreds. A row opens the builder; the switch
 * saves at once (off: it stays here, but the inbox no longer offers it).
 */

const statusFilters = ["All", "Active", "Inactive"] as const;

/** The Content column's icons, in the order the summary reads. */
const COUNTED_TYPES: readonly TemplateBlockType[] = ["TEXT", "IMAGE", "DOCUMENT", "AUDIO", "BUTTON"];

/** The first text of a template, for the Content column. */
export function firstText(template: MessageTemplate) {
  const text = template.blocks.find((block) => block.type === "TEXT");
  return text && text.type === "TEXT" ? text.text.replace(/\s+/g, " ").trim() : "";
}

export function TemplatesTable({ templates }: { templates: readonly MessageTemplate[] }) {
  const router = useRouter();
  const [busy, startBusy] = useLockedTransition("Updating the template…");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("All");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return templates.filter((template) => {
      const matchesQuery = !needle || template.name.toLowerCase().includes(needle) || firstText(template).toLowerCase().includes(needle);
      const matchesStatus = status === "All" || (status === "Active") === template.active;
      return matchesQuery && matchesStatus;
    });
  }, [query, status, templates]);

  function setActive(template: MessageTemplate, active: boolean) {
    startBusy(async () => {
      const result = await setTemplateActive(template.id, active);
      if (!result.ok) showTopBanner(result.error);
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
        <div
          role="group"
          aria-label="Filter by status"
          className="inline-flex max-w-full shrink-0 self-start overflow-x-auto rounded-lg border border-border/60 bg-muted p-0.5"
        >
          {statusFilters.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(option)}
              aria-pressed={status === option}
              className={cn(
                "inline-flex h-6 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-transparent px-2 text-[0.7rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
                status === option ? "border-border bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or text"
              aria-label="Search templates"
              className="bg-muted/30 pl-8 text-xs"
            />
          </div>

          {/* The page's one primary action, and the only black button on it. */}
          <Button
            size="sm"
            render={<Link href="/templates/new" />}
            nativeButton={false}
            className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}
          >
            <Plus className="size-3" />
            New template
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 [scrollbar-gutter:stable] [&>[data-slot=table-container]]:overflow-visible">
        <Table className="min-w-[56rem] table-fixed border-separate border-spacing-0 text-xs [&_td]:px-1.5 [&_th]:px-1.5 [&_th]:whitespace-nowrap [&_td:first-child]:pl-3 [&_th:first-child]:pl-3 [&_td:last-child]:pr-4 [&_th:last-child]:pr-4">
          <TableHeader className="[&_tr]:border-0 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:border-0 [&_th]:bg-muted/95 [&_th]:backdrop-blur-sm [&_th:first-child]:rounded-l-lg [&_th:last-child]:rounded-r-lg">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-56">Name</TableHead>
              <TableHead className="w-24">Language</TableHead>
              <TableHead>Content</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-44">Updated</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.map((template) => {
              const text = firstText(template);
              return (
                <TableRow
                  key={template.id}
                  onClick={() => router.push(`/templates/${template.id}`)}
                  className="group cursor-pointer border-b border-border/80 last:border-0"
                >
                  <TableCell>
                    {/* A real link too, for the keyboard and "open in a new tab"; the row's click is for the mouse. */}
                    <Link
                      href={`/templates/${template.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="block truncate font-medium text-foreground hover:underline"
                    >
                      {template.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{languageLabel(template.language)}</Badge>
                  </TableCell>
                  <TableCell>
                    {/* What the template is made of, one icon per kind (the builder's icons);
                        the backend's sentence stays for the tooltip and screen readers. */}
                    <p className="flex items-center gap-2.5 text-foreground" title={template.summary} aria-label={template.summary}>
                      {COUNTED_TYPES.map((type) => {
                        const count = template.blocks.filter((block) => block.type === type).length;
                        if (count === 0) return null;
                        const Icon = BLOCK_ICONS[type];
                        return (
                          <span key={type} aria-hidden className="inline-flex items-center gap-1 tabular-nums">
                            <Icon className="size-3 text-muted-foreground" />
                            {count}
                          </span>
                        );
                      })}
                    </p>
                    {text ? <p className="mt-0.5 truncate text-[0.6rem] text-muted-foreground">{text}</p> : null}
                  </TableCell>
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <span className="inline-flex items-center gap-2">
                      <Switch
                        checked={template.active}
                        disabled={busy}
                        onCheckedChange={(checked) => setActive(template, checked)}
                        size="sm"
                        aria-label={`${template.active ? "Deactivate" : "Activate"} ${template.name}`}
                      />
                      <span className={cn("text-[0.65rem] font-medium", template.active ? "text-foreground" : "text-muted-foreground")}>
                        {template.active ? "Active" : "Inactive"}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <p className="tabular-nums">{utcStamp(template.updatedAt)}</p>
                    {template.updatedByName ? <p className="mt-0.5 truncate text-[0.6rem]">by {template.updatedByName}</p> : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filtered.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-1 text-center text-xs text-muted-foreground">
            {templates.length === 0 ? (
              <>
                <p className="font-medium text-foreground">No templates yet.</p>
                <p>Write the messages the team sends most, once, and send them from the WhatsApp Inbox in one click.</p>
              </>
            ) : (
              "No templates match your filters."
            )}
          </div>
        ) : null}
      </div>

      <footer className="flex min-h-12 shrink-0 items-center border-t px-4 py-2 text-xs text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
          <span className="font-medium text-foreground">{templates.length}</span>{" "}
          {templates.length === 1 ? "template" : "templates"}
        </p>
      </footer>
    </div>
  );
}
