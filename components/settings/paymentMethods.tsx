"use client";

import Link from "next/link";
import { Fragment, useState, type CSSProperties, type ReactNode } from "react";
import { CircleCheck, CirclePlus, CircleSlash, LayoutGrid, MoreVertical, Pencil, Rows3, Trash2, WalletCards } from "lucide-react";
import { PaymentIcon } from "react-svg-credit-card-payment-icons";
import { cn } from "cn";

import { PaymentMethodCard, ProviderLogo, providerLogos } from "@/components/settings/paymentMethodCard";
import { paymentMethods, type PaymentMethod } from "@/components/settings/paymentMethodsSample";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  PAYMENT_METHODS_VIEW_COOKIE,
  PAYMENT_METHODS_VIEW_COOKIE_MAX_AGE,
  type PaymentMethodsView,
} from "@/lib/settings/paymentMethodsView";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import styles from "./paymentMethods.module.css";

type MethodId = PaymentMethod["id"];
type View = PaymentMethodsView;

const editHref = (id: MethodId) => `/configuration/payment-methods/${id}/edit`;

// Same look as the tabs in the Configuration header.
function ViewSwitch({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  const options = [
    { value: "cards", label: "Cards view", icon: LayoutGrid },
    { value: "table", label: "Table view", icon: Rows3 },
  ] as const;

  return (
    <div role="group" aria-label="View" className="inline-flex rounded-lg border border-border/60 bg-muted p-0.5">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={view === value}
          aria-label={label}
          title={label}
          className={cn(
            "inline-flex size-6 items-center justify-center rounded-md border border-transparent transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
            view === value ? "border-border bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
        </button>
      ))}
    </div>
  );
}

// Same pills as the clients table.
const statusStyles = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-muted text-muted-foreground",
};

// Round buttons on a card, in the white button style (its own gradient and 3D shadows, nothing overridden but the shape and padding).
// The colour is left off here so each action can set its own — see the toggle below.
const cardActionBase = cn(whiteStyle.button, "flex size-9 items-center justify-center rounded-full! p-0! focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring");
const cardActionClassName = cn(cardActionBase, "text-foreground");

// The colour names the action, not the state: red while the method is on,
// because the button switches it off; green while it is off, because the button
// switches it on. Read at a glance on a hovered card, which is the only moment
// it is visible.
const cardToggleClassName = (active: boolean) =>
  cn(cardActionBase, active ? "text-destructive!" : "text-emerald-600!");

/**
 * One card action, on an arc around the card's top-right corner.
 *
 * <p>⚠️ <b>Revealed by hover and by keyboard focus, and no longer by focus of
 * any kind.</b> It was `group-focus-within`, which meant that clicking one of
 * these left it focused and so left the whole arc stuck open after the pointer
 * had gone — and the card underneath kept its hover scale too. The next click
 * went to dismissing that state rather than to what was clicked, which is the
 * "I have to click somewhere else first" this had.
 *
 * <p>`:focus-visible` is the distinction that fixes it: browsers set it for
 * keyboard focus and not for a mouse click, so tabbing still opens the arc and
 * clicking no longer pins it open.
 *
 * <p>A pointer that cannot hover has nothing to reveal them with, so there they
 * are simply always out. That replaces the old `tabIndex` on the card, which
 * existed only so that a tap would count as focus.
 */
function CornerAction({ x, y, index, children }: { x: number; y: number; index: number; children: ReactNode }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute top-0 left-0 -mt-[18px] -ml-[18px] translate-x-0 translate-y-0 scale-50 opacity-0 transition-[translate,scale,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none",
        "group-hover:pointer-events-auto group-hover:translate-x-(--x) group-hover:translate-y-(--y) group-hover:scale-100 group-hover:opacity-100",
        "group-has-[:focus-visible]:pointer-events-auto group-has-[:focus-visible]:translate-x-(--x) group-has-[:focus-visible]:translate-y-(--y) group-has-[:focus-visible]:scale-100 group-has-[:focus-visible]:opacity-100",
        "[@media(hover:none)]:pointer-events-auto [@media(hover:none)]:translate-x-(--x) [@media(hover:none)]:translate-y-(--y) [@media(hover:none)]:scale-100 [@media(hover:none)]:opacity-100",
      )}
      style={{ "--x": `${x}px`, "--y": `${y}px`, transitionDelay: `${index * 50}ms` } as CSSProperties}
    >
      {children}
    </span>
  );
}

type ActionsProps = {
  activeById: Record<MethodId, boolean>;
  /** Asks for confirmation rather than switching — see the dialog at the foot of PaymentMethods. */
  onToggleActive: (method: PaymentMethod) => void;
  onDelete: (method: PaymentMethod) => void;
};

// The table view, built with the same classes as the clients table.
function PaymentMethodsTable({ methods, activeById, onToggleActive, onDelete }: ActionsProps & { methods: readonly PaymentMethod[] }) {
  return (
    <div className="mt-5">
      <div className="overflow-x-auto [&>[data-slot=table-container]]:overflow-visible">
        <Table className="min-w-[860px] table-fixed border-separate border-spacing-0 text-xs">
          <TableHeader className="[&_tr]:border-0 [&_th]:border-0 [&_th]:bg-muted/95 [&_th]:backdrop-blur-sm [&_th:first-child]:rounded-l-lg [&_th:last-child]:rounded-r-lg">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-48">Method</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-36">Balance</TableHead>
              <TableHead className="w-36">Holder</TableHead>
              <TableHead className="w-36">Networks</TableHead>
              <TableHead className="w-28">Region</TableHead>
              <TableHead className="w-20 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {methods.map((method) => (
              <TableRow key={method.id} className="group border-b border-border/80 last:border-0">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    {/* A small swatch of the card: same background, same logo. */}
                    <span className={cn(styles.fixed, styles.card, styles[method.id], "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg")}>
                      <ProviderLogo id={method.id} compact />
                    </span>
                    <div className="min-w-0">
                      {/* The method's own name first, then which provider and type it is. */}
                      <p className="truncate font-medium text-foreground">{method.name}</p>
                      <p className="mt-0.5 truncate text-[0.6rem] text-muted-foreground">{providerLogos[method.id].name} · {method.type}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[0.6rem] font-medium", statusStyles[activeById[method.id] ? "active" : "inactive"])}>
                    <span className="size-1.5 rounded-full bg-current opacity-70" />
                    {activeById[method.id] ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-foreground tabular-nums">{method.amount}</span>{" "}
                  <span className="text-[0.6rem] text-muted-foreground">{method.currency}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">{method.holder}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {method.networks.map((network, index) => (
                      <Fragment key={network}>
                        {index > 0 ? <span aria-hidden className="h-4 w-px bg-border" /> : null}
                        <PaymentIcon type={network} format="logo" className="h-auto w-8" />
                      </Fragment>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{method.region}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Actions for ${method.name}`} />}>
                      <MoreVertical className="size-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-auto min-w-36 whitespace-nowrap">
                      {/* The same red/green as the card's toggle: the colour
                          names the action, not the current state. */}
                      <DropdownMenuItem
                        className={cn(
                          "text-xs",
                          activeById[method.id]
                            ? "text-destructive focus:text-destructive"
                            : "text-emerald-700 focus:text-emerald-700",
                        )}
                        onClick={() => onToggleActive(method)}
                      >
                        {activeById[method.id] ? <><CircleSlash className="size-3.5" /> Deactivate</> : <><CircleCheck className="size-3.5" /> Activate</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs" render={<Link href={editHref(method.id)} />}>
                        <Pencil className="size-3.5" /> Edit method
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" className="text-xs" onClick={() => onDelete(method)}>
                        <Trash2 className="size-3.5" /> Delete method
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Same empty message as the clients table. */}
        {methods.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center text-xs text-muted-foreground">No payment methods yet.</div>
        ) : null}
      </div>

      {/* The "Add new method" card has no place in a table, so its link sits below it. */}
      <Link href="/configuration/payment-methods/new" className="mt-3 inline-flex items-center gap-1.5 px-2 text-xs font-medium text-teal-600 hover:text-teal-700">
        <CirclePlus className="size-4" aria-hidden />
        Add new method
      </Link>
    </div>
  );
}

export function PaymentMethods({ initialView }: { initialView: View }) {
  // Starts from the cookie the page read on the server, and writes the cookie back when switched.
  const [view, setViewState] = useState<View>(initialView);
  function setView(next: View) {
    setViewState(next);
    document.cookie = `${PAYMENT_METHODS_VIEW_COOKIE}=${next}; Path=/; Max-Age=${PAYMENT_METHODS_VIEW_COOKIE_MAX_AGE}; SameSite=Lax`;
  }

  // Active status and deletions start from the sample data and are shown in both views.
  // Kept on screen only for now: they reset on reload until they are saved for real.
  const [activeById, setActiveById] = useState(
    () => Object.fromEntries(paymentMethods.map((method) => [method.id, method.active])) as Record<MethodId, boolean>,
  );
  // Switching a method off stops clients being able to pay with it, which is
  // not something to do by brushing past a button on a card — so it is asked
  // for the same way deleting is.
  const [methodToToggle, setMethodToToggle] = useState<PaymentMethod | null>(null);
  const togglingActive = methodToToggle ? activeById[methodToToggle.id] : false;

  function toggleActive() {
    if (!methodToToggle) return;
    setActiveById((current) => ({ ...current, [methodToToggle.id]: !current[methodToToggle.id] }));
    setMethodToToggle(null);
  }

  const [deletedIds, setDeletedIds] = useState<ReadonlySet<MethodId>>(() => new Set());
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null);
  const methods = paymentMethods.filter((method) => !deletedIds.has(method.id));

  function deleteMethod() {
    if (!methodToDelete) return;
    setDeletedIds((current) => new Set(current).add(methodToDelete.id));
    setMethodToDelete(null);
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Payment methods</h2>
          <p className="mt-1 text-xs text-muted-foreground">Choose how your clients can pay you.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border bg-muted/40 px-2.5 py-1 text-[0.65rem] text-muted-foreground">
            {methods.length} {methods.length === 1 ? "method" : "methods"}
          </span>
          <ViewSwitch view={view} onChange={setView} />
        </div>
      </div>

      {view === "table" ? (
        <PaymentMethodsTable methods={methods} activeById={activeById} onToggleActive={setMethodToToggle} onDelete={setMethodToDelete} />
      ) : (
      // Columns follow the panel's width, not the window's, so they adapt when the sidebar opens or closes:
      // 1 → 2 (448px) → 3 (768px) → 4 (1152px). Three columns wait for 768px so each card stays about 245px wide.
      <div className="@container mt-5">
      <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @3xl:grid-cols-3 @6xl:grid-cols-4">
        {methods.length === 0 ? (
          <div className="col-span-full flex min-h-24 items-center justify-center rounded-2xl border border-dashed p-6 text-center text-xs text-muted-foreground">
            No payment methods yet. Add your first one to start receiving payments.
          </div>
        ) : null}

        {methods.map((method) => (
          // Hovering the card grows it and pops its actions out of the top-right corner.
          // No tabIndex: the card itself was never a destination, and making it one is what
          // let a click leave it focused with its actions stuck open. The actions are buttons
          // and a link, so they are reachable by keyboard on their own.
          <div key={method.id} className="group relative flex rounded-2xl">
            <div className="flex flex-1 rounded-2xl transition-transform group-hover:scale-[1.03] group-has-[:focus-visible]:scale-[1.03] motion-reduce:group-hover:scale-100 motion-reduce:group-has-[:focus-visible]:scale-100">
              <PaymentMethodCard
                provider={method.id}
                active={activeById[method.id]}
                methodName={method.name}
                amount={method.amount}
                currency={method.currency}
                holder={method.holder}
                networks={method.networks}
              />
            </div>

            {/* The arc's center: over the contactless icon, 32px in from the top-right corner.
                The three buttons sit 56px away from it: to the left, diagonally, and below. */}
            <div className="absolute top-8 right-8 z-10">
              <CornerAction x={-56} y={0} index={0}>
                <Link href={editHref(method.id)} aria-label={`Edit ${method.name}`} title="Edit" className={cardActionClassName}>
                  <Pencil className="size-3.5" aria-hidden />
                </Link>
              </CornerAction>
              <CornerAction x={-40} y={40} index={1}>
                <button
                  type="button"
                  onClick={() => setMethodToToggle(method)}
                  aria-label={`${activeById[method.id] ? "Deactivate" : "Activate"} ${method.name}`}
                  title={activeById[method.id] ? "Deactivate" : "Activate"}
                  className={cardToggleClassName(activeById[method.id])}
                >
                  {activeById[method.id] ? <CircleSlash className="size-3.5" aria-hidden /> : <CircleCheck className="size-3.5" aria-hidden />}
                </button>
              </CornerAction>
              <CornerAction x={0} y={56} index={2}>
                <button
                  type="button"
                  onClick={() => setMethodToDelete(method)}
                  aria-label={`Delete ${method.name}`}
                  title="Delete"
                  className={cn(cardActionClassName, "text-destructive!")}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </CornerAction>
            </div>
          </div>
        ))}

        <Link href="/configuration/payment-methods/new" className="group flex min-h-48 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-muted-foreground/40 bg-card p-6 text-center shadow-sm outline-none transition-[scale,box-shadow,border-color] hover:scale-[1.03] hover:border-muted-foreground/60 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:hover:scale-100">
          <span aria-hidden className={cn(whiteStyle.button, "mb-3 flex size-12 items-center justify-center p-0! text-foreground transition-transform group-hover:scale-105 motion-reduce:group-hover:scale-100")}>
            <WalletCards className="size-5" strokeWidth={1.75} />
          </span>
          <span className="text-sm font-semibold">New payment method</span>
          <span className="max-w-56 text-xs leading-relaxed text-muted-foreground">Add another way for your clients to pay you, like a card or a bank transfer</span>
          <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 group-hover:text-teal-700">
            <CirclePlus className="size-4" aria-hidden />
            Add new method
          </span>
        </Link>
      </div>
      </div>
      )}

      {/* Switching a method off is not destructive, so it is not drawn in red —
          but it does stop clients paying, which is worth a moment's pause.
          Cards and table both come here. */}
      <AlertDialog open={Boolean(methodToToggle)} onOpenChange={(open) => { if (!open) setMethodToToggle(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {togglingActive ? "Deactivate" : "Activate"} {methodToToggle?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {togglingActive
                ? "Clients will no longer be able to pay with this method. Payments already made are not affected."
                : "Clients will be able to pay with this method again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm">Cancel</AlertDialogCancel>
            <AlertDialogAction size="sm" onClick={toggleActive}>
              {togglingActive ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* One confirmation for both views, like deleting a client. */}
      <AlertDialog open={Boolean(methodToDelete)} onOpenChange={(open) => { if (!open) setMethodToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {methodToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This payment method will be removed. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm">Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" size="sm" onClick={deleteMethod}>Delete method</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
