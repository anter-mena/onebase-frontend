import type { ReactNode } from "react";

import { PageSkeleton } from "@/components/loading/pageSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

/** A field: its real label, then its grey control. */
function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <span className="text-sm leading-snug font-medium">{label}</span>
      {children}
    </div>
  );
}

/** A row of radio choices in its rounded frame (Status, Card network), each choice grey. */
function Choices({ count, frameClassName }: { count: number; frameClassName: string }) {
  return (
    <div className={`rounded-xl border bg-background ${frameClassName}`}>
      <div className="flex flex-col divide-y divide-border sm:flex-row sm:divide-x sm:divide-y-0">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="flex min-w-0 flex-1 items-center justify-start gap-1.5 px-3 py-2.5 sm:justify-center sm:py-0">
            <span className="size-4 shrink-0 rounded-full border border-input" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * New / Edit payment method while it loads — paymentMethodForm.tsx as a whole:
 * the "Method details" heading, then its own `@container` with the two halves —
 * the form card (name and holder, type and status, card network, instructions,
 * Cancel and Save) and the card preview. From `@5xl` they sit side by side; below
 * it the preview comes first, above the form, as on the page.
 *
 * <p>Headings, labels and captions are the real words for each mode; the
 * controls and the card are grey.
 */
export function PaymentMethodFormSkeleton({ mode }: { mode: "create" | "edit" }) {
  return (
    <PageSkeleton
      back={{ href: "/configuration?tab=payment-methods", label: "Payment methods" }}
      title={mode === "create" ? "New payment method" : "Edit payment method"}
      description={mode === "create" ? "Add another way for your clients to pay you." : "Update the details of this method."}
      scroll
      sectionClassName="flex flex-col p-4 md:p-6"
    >
      <div className="shrink-0">
        <h2 className="text-sm font-medium">Method details</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === "edit"
            ? "Change the details. The card preview updates as you go."
            : "Fill in the details. The card preview updates as you go."}
        </p>
      </div>

      <div className="@container mt-4 flex-1">
        <div className="grid h-full gap-8 @5xl:grid-cols-2">
          <div className="w-full max-w-xl min-w-0 self-center justify-self-center rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Method name">
                  <Skeleton className="h-8 w-full rounded-lg" />
                </Field>
                <Field label="Holder name">
                  <Skeleton className="h-8 w-full rounded-lg" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Field label="Type">
                  <Skeleton className="h-8 w-full rounded-lg" />
                </Field>
                <Field label="Status">
                  <Choices count={2} frameClassName="sm:py-1.5" />
                </Field>
              </div>
              <Field
                label={
                  <>
                    Card network <span className="ml-1 text-xs font-normal text-muted-foreground">· the logos on the card</span>
                  </>
                }
              >
                <Choices count={3} frameClassName="sm:py-2.5" />
              </Field>
              <Field label="Instructions for clients (optional)">
                <Skeleton className="h-14 w-full rounded-lg" />
              </Field>
              <div className="flex justify-end gap-2 border-t pt-4">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-7 w-28" />
              </div>
            </div>
          </div>

          {/* The live preview: first on a narrow screen, the right half on a wide one. */}
          <div className="order-first flex flex-col items-center self-center @5xl:order-none">
            <p className="mb-3 w-full max-w-96 text-xs font-medium text-muted-foreground">Preview</p>
            <div className="flex w-full max-w-96">
              <Skeleton className="min-h-48 flex-1 rounded-2xl" />
            </div>
            <p className="mt-3 w-full max-w-96 text-xs text-muted-foreground">
              {mode === "create" ? "A new method starts at $0.00: payments recorded on it add up here." : "Updates as you fill in the form."}
            </p>
          </div>
        </div>
      </div>
    </PageSkeleton>
  );
}
