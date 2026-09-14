"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CircleCheck, CircleSlash, ExternalLink, FileDown, Link2, MoreVertical, Plus, Trash2 } from "lucide-react";
import { cn } from "cn";

import { QuarterSparkline } from "@/components/charts/quarterSparkline";
import { Checkbox } from "@/components/ui/checkbox";
import { downloadCsv } from "@/lib/csv";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Brands: the admin only pastes a link; the name, full URL, logo and social links are looked up from the site.
// The real lookup runs on the server in the logic phase; for now it answers from sample results.

type Social = "instagram" | "facebook" | "x" | "tiktok";

type Brand = {
  domain: string;
  name: string;
  url: string;
  // Simple Icons slug to try first for the logo (see BrandLogo for the fallbacks), or null to skip straight to the site icon.
  logo: string | null;
  socials: Partial<Record<Social, string>>;
  clients: number;
  // New clients per quarter of 2026 (Q1–Q4); they add up to clients. Drawn as the small chart in the Clients column.
  clientTrend: number[];
  active: boolean;
  addedAt: string;
};

type LookupResult = Pick<Brand, "domain" | "name" | "url" | "logo" | "socials">;

const socialLabels: Record<Social, string> = { instagram: "Instagram", facebook: "Facebook", x: "X", tiktok: "TikTok" };
const socialOrder: readonly Social[] = ["instagram", "facebook", "x", "tiktok"];

// Client counts match the clients table (6 Nike, 6 Adidas).
const sampleBrands: readonly Brand[] = [
  {
    domain: "nike.com",
    name: "Nike",
    url: "https://www.nike.com",
    logo: "nike",
    socials: { instagram: "https://www.instagram.com/nike", facebook: "https://www.facebook.com/nike", x: "https://x.com/Nike", tiktok: "https://www.tiktok.com/@nike" },
    clients: 6,
    clientTrend: [1, 2, 1, 2],
    active: true,
    addedAt: "2026-01-12",
  },
  {
    domain: "adidas.com",
    name: "Adidas",
    url: "https://www.adidas.com",
    logo: "adidas",
    socials: { instagram: "https://www.instagram.com/adidas", facebook: "https://www.facebook.com/adidas", x: "https://x.com/adidas", tiktok: "https://www.tiktok.com/@adidas" },
    clients: 6,
    clientTrend: [2, 1, 2, 1],
    active: true,
    addedAt: "2026-02-03",
  },
  {
    domain: "puma.com",
    name: "Puma",
    url: "https://www.puma.com",
    logo: "puma",
    socials: { instagram: "https://www.instagram.com/puma", facebook: "https://www.facebook.com/PUMA", x: "https://x.com/PUMA" },
    clients: 0,
    clientTrend: [0, 0, 0, 0],
    active: false,
    addedAt: "2026-08-21",
  },
];

// Stand-in for the server lookup: a few known sites, and for any other site a name guessed from the domain.
const sampleLookups: Record<string, LookupResult> = {
  "reebok.com": { domain: "reebok.com", name: "Reebok", url: "https://www.reebok.com", logo: "reebok", socials: { instagram: "https://www.instagram.com/reebok", facebook: "https://www.facebook.com/Reebok", x: "https://x.com/Reebok" } },
  "newbalance.com": { domain: "newbalance.com", name: "New Balance", url: "https://www.newbalance.com", logo: "newbalance", socials: { instagram: "https://www.instagram.com/newbalance", facebook: "https://www.facebook.com/newbalance", tiktok: "https://www.tiktok.com/@newbalance" } },
  "underarmour.com": { domain: "underarmour.com", name: "Under Armour", url: "https://www.underarmour.com", logo: "underarmour", socials: { instagram: "https://www.instagram.com/underarmour", x: "https://x.com/UnderArmour" } },
};

function lookupBrand(domain: string): LookupResult {
  const known = sampleLookups[domain];
  if (known) return known;
  const label = domain.split(".")[0];
  // The logo is a guess from the domain ("google.com" → Simple Icons "google"); BrandLogo falls back when it does not exist.
  return { domain, name: label.charAt(0).toUpperCase() + label.slice(1), url: `https://${domain}`, logo: label.replace(/[^a-z0-9]/g, ""), socials: {} };
}

// "puma.com", "www.puma.com/en", "https://www.puma.com" → "puma.com". Anything that is not a web address → null.
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

// Same pills as the clients and payment methods tables.
const statusStyles = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-muted text-muted-foreground",
};

// "Jan 12, 2026". UTC and a fixed locale, so the server and the browser show the same date.
const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

// A monochrome Simple Icons logo, tinted with the text color through a CSS mask.
function SimpleIcon({ slug, label, className }: { slug: string; label?: string; className?: string }) {
  const src = `https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/${slug}.svg`;
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("block bg-current", className)}
      style={{ mask: `url(${src}) center / contain no-repeat`, WebkitMask: `url(${src}) center / contain no-repeat` }}
    />
  );
}

// The brand's logo in a small tile, like the client avatars. It tries each source in turn and moves on when one fails to load:
//   1. Simple Icons, by slug: clean logos for well-known brands (Google, Facebook, TikTok…);
//   2. the site's own icon, through Google's favicon service: works for almost any website (Amazon, OpenAI…);
//   3. the brand's initial, when neither loads.
// Render it with key={domain}, so a different brand starts again from the first source.
function BrandLogo({ brand }: { brand: Pick<Brand, "name" | "logo" | "domain"> }) {
  const sources = [
    brand.logo ? `https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/${brand.logo}.svg` : null,
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(brand.domain)}&sz=64`,
  ].filter((source): source is string => source !== null);
  const [failed, setFailed] = useState(0);
  const source = sources[failed];

  return (
    <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-background">
      {source ? (
        <Image src={source} alt="" width={18} height={18} unoptimized onError={() => setFailed((count) => count + 1)} className="size-[18px] object-contain" />
      ) : (
        <span className="text-xs font-semibold text-muted-foreground">{brand.name.charAt(0)}</span>
      )}
    </span>
  );
}

// Always the four networks in the same order, with a thin line between them, so the columns line up across rows.
// A network the brand does not have shows "-" in its place.
function SocialLinks({ socials, brandName }: { socials: Brand["socials"]; brandName: string }) {
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
              <SimpleIcon slug={social} className="size-3.5" />
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

// The Brands tab of the Configuration page: paste a link to add a brand, and the brands in a table.
export function Brands() {
  // Brands, status changes and deletions start from the sample data. Kept on screen only for now: they reset on reload.
  const [brands, setBrands] = useState<readonly Brand[]>(sampleBrands);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);

  const [link, setLink] = useState("");
  const domain = toDomain(link);
  const alreadyAdded = domain ? brands.some((brand) => brand.domain === domain) : false;

  // The lookup answers a moment after typing stops, like a real request would.
  const [lookedUp, setLookedUp] = useState<LookupResult | null>(null);
  useEffect(() => {
    if (!domain || alreadyAdded) return;
    const timeout = window.setTimeout(() => setLookedUp(lookupBrand(domain)), 600);
    return () => window.clearTimeout(timeout);
  }, [domain, alreadyAdded]);

  const preview = domain && !alreadyAdded && lookedUp?.domain === domain ? lookedUp : null;
  const isLookingUp = Boolean(domain) && !alreadyAdded && !preview;
  const showInvalid = link.trim().length > 0 && !domain;

  function addBrand() {
    if (!preview) return;
    // Today's date in UTC, like the other dates in the table.
    setBrands((current) => [...current, { ...preview, clients: 0, clientTrend: [0, 0, 0, 0], active: true, addedAt: new Date().toISOString().slice(0, 10) }]);
    setLink("");
  }

  function toggleActive(domainToToggle: string) {
    setBrands((current) => current.map((brand) => (brand.domain === domainToToggle ? { ...brand, active: !brand.active } : brand)));
  }

  function deleteBrand() {
    if (!brandToDelete) return;
    setBrands((current) => current.filter((brand) => brand.domain !== brandToDelete.domain));
    setSelected((current) => {
      const next = new Set(current);
      next.delete(brandToDelete.domain);
      return next;
    });
    setBrandToDelete(null);
  }

  // Row selection, like the clients table. Export uses the selected brands, or every brand when none is selected.
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const allSelected = brands.length > 0 && brands.every((brand) => selected.has(brand.domain));

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(brands.map((brand) => brand.domain)) : new Set());
  }

  function toggleBrand(domainToToggle: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(domainToToggle);
      else next.delete(domainToToggle);
      return next;
    });
  }

  function exportCsv() {
    const exported = selected.size > 0 ? brands.filter((brand) => selected.has(brand.domain)) : brands;
    downloadCsv(
      "one-base-brands.csv",
      ["Brand", "Domain", "Website", "Instagram", "Facebook", "X", "TikTok", "Clients", "Status", "Added"],
      exported.map((brand) => [
        brand.name,
        brand.domain,
        brand.url,
        ...socialOrder.map((social) => brand.socials[social] ?? "-"),
        brand.clients,
        brand.active ? "Active" : "Inactive",
        brand.addedAt,
      ]),
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Brands</h2>
          <p className="mt-1 text-xs text-muted-foreground">Paste a brand&apos;s website: its name, logo and social links are found for you.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border bg-muted/40 px-2.5 py-1 text-[0.65rem] text-muted-foreground">
            {brands.length} {brands.length === 1 ? "brand" : "brands"}
          </span>
          {/* Same button as the clients table. */}
          <Button type="button" size="sm" onClick={exportCsv} disabled={brands.length === 0} className={cn(blackStyle.button, "gap-1.5 px-3! py-0! text-[0.65rem]! font-normal! disabled:opacity-50")}>
            <FileDown className="size-3" aria-hidden />
            {selected.size > 0 ? `Export ${selected.size} selected` : "Export CSV"}
          </Button>
        </div>
      </div>

      {/* Paste bar: a link in, a preview of what was found under it, then Add. */}
      <form
        onSubmit={(event) => { event.preventDefault(); addBrand(); }}
        className="mt-5 rounded-2xl border bg-card p-3 shadow-sm"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Link2 className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={link}
              onChange={(event) => setLink(event.target.value)}
              // Not type="url": the browser would refuse "reebok.com" without https://, which toDomain accepts.
              inputMode="url"
              placeholder="Paste a brand link, e.g. https://www.reebok.com"
              aria-label="Brand website link"
              aria-invalid={showInvalid || alreadyAdded || undefined}
              className="pl-8 text-xs md:text-xs"
            />
          </div>
          <Button type="submit" size="sm" disabled={!preview} className={cn(blackStyle.button, "h-8 gap-1.5 px-3! py-0! text-xs! font-medium! disabled:opacity-50")}>
            <Plus className="size-3.5" aria-hidden />
            Add brand
          </Button>
        </div>

        {/* What the link gave: a hint, a loading row, or the found brand. */}
        <div aria-live="polite" className="mt-2 min-h-11">
          {showInvalid ? (
            <p className="px-1 py-3 text-xs text-destructive">Enter a website link, like https://www.reebok.com.</p>
          ) : alreadyAdded ? (
            <p className="px-1 py-3 text-xs text-destructive">This brand is already in your list.</p>
          ) : isLookingUp ? (
            <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 px-2.5 py-1.5">
              <span className="size-8 shrink-0 animate-pulse rounded-lg bg-muted" />
              <span className="space-y-1.5">
                <span className="block h-2.5 w-24 animate-pulse rounded bg-muted" />
                <span className="block h-2 w-36 animate-pulse rounded bg-muted" />
              </span>
              <span className="ml-auto text-[0.65rem] text-muted-foreground">Looking up {domain}…</span>
            </div>
          ) : preview ? (
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-xl bg-muted/40 px-2.5 py-1.5">
              <BrandLogo key={preview.domain} brand={preview} />
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium">{preview.name}</span>
                <span className="block truncate text-[0.65rem] text-muted-foreground">{preview.url}</span>
              </span>
              <span className="ml-auto">
                <SocialLinks socials={preview.socials} brandName={preview.name} />
              </span>
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
            {brands.map((brand) => (
              <TableRow
                key={brand.domain}
                data-state={selected.has(brand.domain) ? "selected" : undefined}
                // group: hovering the row shows all four points of the Clients chart, like the clients table.
                className="group border-b border-border/80 last:border-0"
              >
                <TableCell>
                  <Checkbox checked={selected.has(brand.domain)} onCheckedChange={(checked) => toggleBrand(brand.domain, checked === true)} aria-label={`Select ${brand.name}`} className="size-3.5" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <BrandLogo key={brand.domain} brand={brand} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{brand.name}</p>
                      <p className="mt-0.5 truncate text-[0.6rem] text-muted-foreground">{brand.domain}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <a href={brand.url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline">
                    <span className="truncate">{brand.url}</span>
                    <ExternalLink className="size-3 shrink-0" aria-hidden />
                  </a>
                </TableCell>
                <TableCell>
                  <SocialLinks socials={brand.socials} brandName={brand.name} />
                </TableCell>
                <TableCell>
                  {/* The same chart as the Orders column in the clients table: new clients per quarter, then the total. */}
                  <QuarterSparkline values={brand.clientTrend} total={brand.clients} unit={{ one: "client", many: "clients" }} />
                </TableCell>
                <TableCell>
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[0.6rem] font-medium", statusStyles[brand.active ? "active" : "inactive"])}>
                    <span className="size-1.5 rounded-full bg-current opacity-70" />
                    {brand.active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{dateFormatter.format(new Date(`${brand.addedAt}T00:00:00Z`))}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Actions for ${brand.name}`} />}>
                      <MoreVertical className="size-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-36">
                      <DropdownMenuItem className="text-xs" onClick={() => toggleActive(brand.domain)}>
                        {brand.active ? <><CircleSlash className="size-3.5" /> Deactivate</> : <><CircleCheck className="size-3.5" /> Activate</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs" render={<a href={brand.url} target="_blank" rel="noopener noreferrer" />}>
                        <ExternalLink className="size-3.5" /> Visit website
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-xs text-destructive focus:text-destructive" onClick={() => setBrandToDelete(brand)}>
                        <Trash2 className="size-3.5" /> Delete brand
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Same empty message as the clients table. */}
        {brands.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center text-xs text-muted-foreground">No brands yet. Paste a link above to add one.</div>
        ) : null}
      </div>

      <AlertDialog open={Boolean(brandToDelete)} onOpenChange={(open) => { if (!open) setBrandToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {brandToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {brandToDelete && brandToDelete.clients > 0
                ? `${brandToDelete.clients} ${brandToDelete.clients === 1 ? "client uses" : "clients use"} this brand. The brand will be removed from your list.`
                : "This brand will be removed from your list."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm">Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" size="sm" onClick={deleteBrand}>Delete brand</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
