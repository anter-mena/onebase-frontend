"use client";

import { useEffect, useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileDown, ImageUp, Link2, MoreVertical, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "cn";

import { lookUpBrand, saveBrand, setBrandActive, type BrandDraft } from "@/app/(private)/configuration/brandActions";
import { QuarterSparkline } from "@/components/charts/quarterSparkline";
import { AutoRefresh } from "@/components/app-shell/autoRefresh";
import { LoadError } from "@/components/errors/loadError";
import { SocialIcon } from "@/components/settings/socialIcons";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { showTopBanner } from "@/components/ui/topBanner";
import { downloadCsv } from "@/lib/csv";
import type { BrandLookup, BrandRow, SocialNetwork, Socials } from "@/lib/brands/types";

/*
 * The Brands tab of the Configuration page.
 *
 * Add: paste a link; the backend reads the site (safely — see the backend's
 * UrlGuard) and suggests the name, social links and logo. Add it as found, or
 * review it first. Edit: change any of it, upload a logo, or fetch again.
 * Switch a brand off and it can't be used for new clients; there is no delete.
 */

const socialLabels: Record<SocialNetwork, string> = { instagram: "Instagram", facebook: "Facebook", x: "X", tiktok: "TikTok" };
const socialOrder: readonly SocialNetwork[] = ["instagram", "facebook", "x", "tiktok"];
const socialPlaceholders: Record<SocialNetwork, string> = {
  instagram: "instagram.com/brand",
  facebook: "facebook.com/brand",
  x: "x.com/brand",
  tiktok: "tiktok.com/@brand",
};

/** The biggest file accepted for an uploaded logo. The backend shrinks it to 128 px anyway. */
const MAX_LOGO_BYTES = 1024 * 1024;

// "puma.com", "www.puma.com/en", "https://www.puma.com" → "puma.com". Anything that is not a web address → null.
// A quick check while typing; the backend applies the real rules.
function toDomain(input: string) {
  const text = input.trim();
  if (!text) return null;
  try {
    const url = new URL(text.includes("://") ? text : `https://${text}`);
    const hostname = url.hostname.replace(/^www\./, "");
    return (url.protocol === "https:" || url.protocol === "http:") && /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(hostname) ? hostname.toLowerCase() : null;
  } catch {
    return null;
  }
}

// "Jan 12, 2026". UTC and a fixed locale, so the server and the browser show the same date.
const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** "New Balance" → "NB": shown in the tile when a brand has no logo. */
function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * The brand's logo in a small tile, like the client avatars — from our own
 * server (the logo is stored in our database), or the initials when it has none.
 */
function BrandLogo({ name, src }: { name: string; src: string | null }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-background">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- our own small PNG (or a data: preview); nothing for next/image to optimise
        <img src={src} alt="" width={18} height={18} className="size-[18px] object-contain" />
      ) : (
        <span className="text-[0.6rem] font-semibold text-muted-foreground">{initials(name)}</span>
      )}
    </span>
  );
}

// Always the four networks in the same order, with a thin line between them, so the columns line up across rows.
// A network the brand does not have shows "-" in its place.
function SocialLinks({ socials, brandName }: { socials: Socials; brandName: string }) {
  return (
    <span className="flex items-center">
      {socialOrder.map((social, index) => (
        <span key={social} className="flex items-center">
          {index > 0 ? <span aria-hidden className="mx-1 h-3.5 w-px bg-border" /> : null}
          {socials[social] ? (
            <a
              href={socials[social]}
              target="_blank"
              rel="noopener noreferrer"
              title={socialLabels[social]}
              aria-label={`${brandName} on ${socialLabels[social]}`}
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <SocialIcon network={social} className="size-3.5" />
            </a>
          ) : (
            <span title={`No ${socialLabels[social]}`} className="flex size-6 items-center justify-center text-muted-foreground">
              -
            </span>
          )}
        </span>
      ))}
    </span>
  );
}

type LookupState =
  | { domain: string; status: "loading" }
  | { domain: string; status: "found"; data: BrandLookup }
  | { domain: string; status: "failed"; error: string };

/** What the Add / Edit window starts from. */
type DialogState = {
  /** null: adding a brand. */
  id: number | null;
  draft: BrandDraft;
  /** The logo shown in the window: the current one, a found one, or an upload. */
  logoPreview: string | null;
};

export function Brands({ brands, loadError }: { brands: BrandRow[] | null; loadError: string | null }) {
  const router = useRouter();
  const list = brands ?? [];

  const [link, setLink] = useState("");
  const domain = toDomain(link);
  const alreadyAdded = domain ? list.some((brand) => brand.domain === domain) : false;

  // The site is read a moment after typing stops. Each answer is kept with the
  // domain it was for, so a slow answer for an old link is never shown.
  const [lookup, setLookup] = useState<LookupState | null>(null);
  useEffect(() => {
    if (!domain || alreadyAdded) return;
    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setLookup({ domain, status: "loading" });
      const result = await lookUpBrand(link);
      if (cancelled) return;
      setLookup(result.ok ? { domain, status: "found", data: result.data } : { domain, status: "failed", error: result.error });
    }, 700);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
    // `link` is read inside, but only a change of domain should start a new lookup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, alreadyAdded]);

  const current = domain && !alreadyAdded && lookup?.domain === domain ? lookup : null;
  const preview = current?.status === "found" && !current.data.existingBrand ? current.data : null;
  const takenBy = current?.status === "found" ? current.data.existingBrand : null;
  const showInvalid = link.trim().length > 0 && !domain;

  const [adding, startAdding] = useTransition();
  const [dialog, setDialog] = useState<DialogState | null>(null);

  function draftFrom(found: BrandLookup): BrandDraft {
    return { websiteUrl: found.websiteUrl, name: found.name, socials: found.socials, logo: found.logo };
  }

  function addAsFound() {
    if (!preview) return;
    startAdding(async () => {
      const result = await saveBrand(null, draftFrom(preview));
      if (!result.ok) {
        showTopBanner(result.error);
        return;
      }
      setLink("");
      setLookup(null);
      router.refresh();
    });
  }

  // Switching on/off: the switch moves at once, and comes back if the backend refuses.
  const [pendingActive, setPendingActive] = useState<ReadonlyMap<number, boolean>>(new Map());
  function toggleActive(brand: BrandRow) {
    const next = !brand.active;
    setPendingActive((map) => new Map(map).set(brand.id, next));
    void setBrandActive(brand.id, next).then((result) => {
      if (!result.ok) showTopBanner(result.error);
      router.refresh();
      setPendingActive((map) => {
        const copy = new Map(map);
        copy.delete(brand.id);
        return copy;
      });
    });
  }

  // Row selection, like the clients table. Export uses the selected brands, or every brand when none is selected.
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set());
  const allSelected = list.length > 0 && list.every((brand) => selected.has(brand.id));

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(list.map((brand) => brand.id)) : new Set());
  }

  function toggleBrand(id: number, checked: boolean) {
    setSelected((currentSelection) => {
      const next = new Set(currentSelection);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function exportCsv() {
    const exported = selected.size > 0 ? list.filter((brand) => selected.has(brand.id)) : list;
    downloadCsv(
      "one-base-brands.csv",
      ["Brand", "Domain", "Website", "Instagram", "Facebook", "X", "TikTok", "Clients", "Status", "Added"],
      exported.map((brand) => [
        brand.name,
        brand.domain,
        brand.websiteUrl,
        ...socialOrder.map((social) => brand.socials[social] ?? "-"),
        brand.clients,
        brand.active ? "Active" : "Inactive",
        brand.createdAt.slice(0, 10),
      ]),
    );
  }

  if (!brands) {
    return <LoadError title="The brands could not be loaded." reason={loadError ?? "Please try again."} />;
  }

  return (
    <>
      {/* New brands, status changes and edits by another Admin show up by themselves. */}
      <AutoRefresh />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Brands</h2>
          <p className="mt-1 text-xs text-muted-foreground">Paste a brand&apos;s website: its name, logo and social links are found for you.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border bg-muted/40 px-2.5 py-1 text-[0.65rem] text-muted-foreground">
            {list.length} {list.length === 1 ? "brand" : "brands"}
          </span>
          {/* Same button as the clients table. */}
          <Button type="button" size="sm" onClick={exportCsv} disabled={list.length === 0} className={cn(blackStyle.button, "gap-1.5 px-3! py-0! text-[0.65rem]! font-normal! disabled:opacity-50")}>
            <FileDown className="size-3" aria-hidden />
            {selected.size > 0 ? `Export ${selected.size} selected` : "Export CSV"}
          </Button>
        </div>
      </div>

      {/* Paste bar: a link in, a preview of what was found under it, then Add. */}
      <form
        onSubmit={(event) => { event.preventDefault(); addAsFound(); }}
        className="mt-5 rounded-2xl border bg-card p-3 shadow-sm"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Link2 className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={link}
              onChange={(event) => setLink(event.target.value)}
              // Not type="url": the browser would refuse "reebok.com" without https://, which is accepted.
              inputMode="url"
              placeholder="Paste a brand link, e.g. https://www.reebok.com"
              aria-label="Brand website link"
              aria-invalid={showInvalid || alreadyAdded || Boolean(takenBy) || undefined}
              className="pl-8 text-xs md:text-xs"
            />
          </div>
          <Button type="submit" size="sm" disabled={!preview || adding} className={cn(blackStyle.button, "h-8 gap-1.5 px-3! py-0! text-xs! font-medium! disabled:opacity-50")}>
            <Plus className="size-3.5" aria-hidden />
            {adding ? "Adding…" : "Add brand"}
          </Button>
        </div>

        {/* What the link gave: a hint, a loading row, an error, or the found brand. */}
        <div aria-live="polite" className="mt-2 min-h-11">
          {showInvalid ? (
            <p className="px-1 py-3 text-xs text-destructive">Enter a website link, like https://www.reebok.com.</p>
          ) : alreadyAdded || takenBy ? (
            <p className="px-1 py-3 text-xs text-destructive">This brand is already in your list{takenBy ? ` (${takenBy})` : ""}.</p>
          ) : current?.status === "failed" ? (
            <p className="px-1 py-3 text-xs text-destructive">{current.error}</p>
          ) : preview ? (
            <div className="rounded-xl bg-muted/40 px-2.5 py-1.5">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <BrandLogo name={preview.name} src={preview.logo} />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium">{preview.name}</span>
                  <span className="block truncate text-[0.65rem] text-muted-foreground">{preview.websiteUrl}</span>
                </span>
                <span className="ml-auto flex items-center gap-2">
                  <SocialLinks socials={preview.socials} brandName={preview.name} />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setDialog({ id: null, draft: draftFrom(preview), logoPreview: preview.logo })}
                    className={cn(whiteStyle.button, "h-7 gap-1.5 px-2.5! py-0! text-[0.65rem]! font-normal!")}
                  >
                    <Pencil className="size-3" aria-hidden />
                    Review first
                  </Button>
                </span>
              </div>
              {preview.warning ? <p className="mt-1.5 text-[0.65rem] text-amber-700 dark:text-amber-400">{preview.warning}</p> : null}
            </div>
          ) : domain && !alreadyAdded ? (
            <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 px-2.5 py-1.5">
              <span className="size-8 shrink-0 animate-pulse rounded-lg bg-muted" />
              <span className="space-y-1.5">
                <span className="block h-2.5 w-24 animate-pulse rounded bg-muted" />
                <span className="block h-2 w-36 animate-pulse rounded bg-muted" />
              </span>
              <span className="ml-auto text-[0.65rem] text-muted-foreground">Reading {domain}…</span>
            </div>
          ) : (
            <p className="px-1 py-3 text-xs text-muted-foreground">The brand&apos;s name, logo and social links will appear here.</p>
          )}
        </div>
      </form>

      {/* Same table classes as the clients, payment methods and subscriptions tables. Scrolls sideways on small screens. */}
      <div className="mt-5 overflow-x-auto [&>[data-slot=table-container]]:overflow-visible">
        <Table className="min-w-[940px] table-fixed border-separate border-spacing-0 text-xs">
          <TableHeader className="[&_tr]:border-0 [&_th]:border-0 [&_th]:bg-muted/95 [&_th]:backdrop-blur-sm [&_th:first-child]:rounded-l-lg [&_th:last-child]:rounded-r-lg">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={(checked) => toggleAll(checked === true)} aria-label="Select all brands" className="size-3.5" />
              </TableHead>
              <TableHead className="w-48">Brand</TableHead>
              <TableHead className="w-52">Website</TableHead>
              <TableHead className="w-36">Social</TableHead>
              <TableHead className="w-32">Clients</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-28">Added</TableHead>
              <TableHead className="w-20 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((brand) => {
              const active = pendingActive.get(brand.id) ?? brand.active;
              return (
                <TableRow
                  key={brand.id}
                  data-state={selected.has(brand.id) ? "selected" : undefined}
                  // group: hovering the row shows all four points of the Clients chart, like the clients table.
                  className="group border-b border-border/80 last:border-0"
                >
                  <TableCell>
                    <Checkbox checked={selected.has(brand.id)} onCheckedChange={(checked) => toggleBrand(brand.id, checked === true)} aria-label={`Select ${brand.name}`} className="size-3.5" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <BrandLogo name={brand.name} src={brand.logoUrl} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{brand.name}</p>
                        <p className="mt-0.5 truncate text-[0.6rem] text-muted-foreground">{brand.domain}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline">
                      <span className="truncate">{brand.websiteUrl}</span>
                      <ExternalLink className="size-3 shrink-0" aria-hidden />
                    </a>
                  </TableCell>
                  <TableCell>
                    <SocialLinks socials={brand.socials} brandName={brand.name} />
                  </TableCell>
                  <TableCell>
                    {/* New clients per quarter, then the total. All zero until the Clients module exists. */}
                    <QuarterSparkline values={[0, 0, 0, 0]} total={brand.clients} unit={{ one: "client", many: "clients" }} />
                  </TableCell>
                  {/* A switch with the word beside it: off means the brand can't be used for new clients. */}
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <Switch
                        checked={active}
                        onCheckedChange={() => toggleActive(brand)}
                        disabled={pendingActive.has(brand.id)}
                        aria-label={`${active ? "Deactivate" : "Activate"} ${brand.name}`}
                        size="sm"
                      />
                      <span className={cn("text-[0.65rem] font-medium", active ? "text-foreground" : "text-muted-foreground")}>
                        {active ? "Active" : "Inactive"}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{dateFormatter.format(new Date(brand.createdAt))}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Actions for ${brand.name}`} />}>
                        <MoreVertical className="size-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-auto min-w-36 whitespace-nowrap">
                        <DropdownMenuItem
                          className="text-xs"
                          onClick={() =>
                            setDialog({
                              id: brand.id,
                              draft: { websiteUrl: brand.websiteUrl, name: brand.name, socials: brand.socials, logo: null },
                              logoPreview: brand.logoUrl,
                            })
                          }
                        >
                          <Pencil className="size-3.5" /> Edit brand
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-xs" render={<a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer" />}>
                          <ExternalLink className="size-3.5" /> Visit website
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {list.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center text-xs text-muted-foreground">No brands yet. Paste a link above to add one.</div>
        ) : null}
      </div>

      {dialog ? (
        <BrandDialog
          // A new key per brand, so the form starts fresh each time it opens.
          key={dialog.id ?? `new-${dialog.draft.websiteUrl}`}
          state={dialog}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            if (dialog.id === null) {
              setLink("");
              setLookup(null);
            }
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}

/**
 * Add (after "Review first") and Edit: every field a brand has, the logo with
 * Upload / Remove, and "Fetch again" to refill it all from the website.
 */
function BrandDialog({ state, onClose, onSaved }: { state: DialogState; onClose: () => void; onSaved: () => void }) {
  const editing = state.id !== null;
  const [name, setName] = useState(state.draft.name);
  const [website, setWebsite] = useState(state.draft.websiteUrl);
  const [socials, setSocials] = useState<Socials>(state.draft.socials);
  const [logo, setLogo] = useState<string | null>(state.draft.logo);
  const [logoPreview, setLogoPreview] = useState<string | null>(state.logoPreview);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "note"; text: string } | null>(null);
  const [fetching, startFetching] = useTransition();
  const [saving, startSaving] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  function fetchAgain() {
    setMessage(null);
    startFetching(async () => {
      const result = await lookUpBrand(website);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      const found = result.data;
      setName(found.name);
      setWebsite(found.websiteUrl);
      setSocials(found.socials);
      if (found.logo) {
        setLogo(found.logo);
        setLogoPreview(found.logo);
        setRemoveLogo(false);
      }
      setFetched(true);
      setMessage(found.warning ? { tone: "note", text: found.warning } : { tone: "note", text: "Filled in again from the website. Check it, then save." });
    });
  }

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      setMessage({ tone: "error", text: "This picture is too large. Use one under 1 MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setLogo(dataUrl);
      setLogoPreview(dataUrl);
      setRemoveLogo(false);
      setMessage(null);
    };
    reader.readAsDataURL(file);
  }

  function save() {
    setMessage(null);
    startSaving(async () => {
      const result = await saveBrand(state.id, {
        websiteUrl: website,
        name,
        socials,
        logo,
        removeLogo,
        fetchedFromSite: fetched,
      });
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      onSaved();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${state.draft.name}` : "Add brand"}</DialogTitle>
          <DialogDescription>
            {editing ? "Change anything below, or fetch it all again from the website." : "Check what was found on the website, then add the brand."}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-3" onSubmit={(event) => { event.preventDefault(); save(); }}>
          {/* The logo: what we store is a small copy made on our server. */}
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-background">
              {logoPreview && !removeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element -- our own small PNG, or the picture just chosen
                <img src={logoPreview} alt="" width={28} height={28} className="size-7 object-contain" />
              ) : (
                <span className="text-xs font-semibold text-muted-foreground">{initials(name)}</span>
              )}
            </span>
            <div className="flex flex-wrap gap-2">
              <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/gif,image/x-icon,image/vnd.microsoft.icon,.ico" className="hidden" onChange={upload} />
              <Button type="button" size="sm" onClick={() => fileInput.current?.click()} className={cn(whiteStyle.button, "h-7 gap-1.5 px-2.5! py-0! text-[0.65rem]! font-normal!")}>
                <ImageUp className="size-3" aria-hidden /> Upload logo
              </Button>
              {logoPreview && !removeLogo ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => { setRemoveLogo(true); setLogo(null); }}
                  className="h-7 gap-1.5 px-2.5 text-[0.65rem] font-normal text-muted-foreground"
                >
                  <Trash2 className="size-3" aria-hidden /> Remove
                </Button>
              ) : null}
            </div>
            <span className="ml-auto text-[0.6rem] text-muted-foreground">PNG, JPEG, GIF or ICO · under 1 MB</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="brand-name">Name</FieldLabel>
              <Input id="brand-name" value={name} maxLength={100} onChange={(event) => setName(event.target.value)} className="h-8 text-xs" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="brand-website">Website</FieldLabel>
              <Input id="brand-website" value={website} inputMode="url" onChange={(event) => setWebsite(event.target.value)} className="h-8 text-xs" required />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {socialOrder.map((network) => (
              <Field key={network}>
                <FieldLabel htmlFor={`brand-${network}`} className="flex items-center gap-1.5">
                  <SocialIcon network={network} className="size-3 text-muted-foreground" />
                  {socialLabels[network]}
                </FieldLabel>
                <Input
                  id={`brand-${network}`}
                  value={socials[network] ?? ""}
                  inputMode="url"
                  placeholder={socialPlaceholders[network]}
                  onChange={(event) => setSocials((currentSocials) => ({ ...currentSocials, [network]: event.target.value }))}
                  className="h-8 text-xs"
                />
              </Field>
            ))}
          </div>

          {message ? (
            <p role={message.tone === "error" ? "alert" : "status"} className={cn("text-[0.65rem]", message.tone === "error" ? "text-destructive" : "text-muted-foreground")}>
              {message.text}
            </p>
          ) : null}

          <DialogFooter className="items-center sm:justify-between">
            <Button
              type="button"
              size="sm"
              onClick={fetchAgain}
              disabled={fetching || saving || !toDomain(website)}
              className={cn(whiteStyle.button, "h-7 gap-1.5 px-2.5! py-0! text-[0.65rem]! font-normal!")}
            >
              <RefreshCw className={cn("size-3", fetching && "animate-spin")} aria-hidden />
              {fetching ? "Reading the site…" : "Fetch again"}
            </Button>
            <span className="flex gap-2">
              <DialogClose render={<Button size="sm" variant="outline" className="h-7 px-3 text-[0.65rem] font-normal" />}>Cancel</DialogClose>
              <Button type="submit" size="sm" disabled={saving || fetching || !name.trim()} className={cn(blackStyle.button, "h-7 px-3! py-0! text-[0.65rem]! font-normal!")}>
                {saving ? "Saving…" : editing ? "Save changes" : "Add brand"}
              </Button>
            </span>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
