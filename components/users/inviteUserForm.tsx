"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Plus, Send, X } from "lucide-react";
import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { workspaceUsers, type UserRole } from "@/lib/users/sample";

/**
 * Invite people into the workspace.
 *
 * <p><b>Several at once, not one at a time.</b> Inviting a team is the normal
 * case and a form that takes one address turns that into five round trips. The
 * addresses are entered as chips so each one can be checked and removed before
 * anything is sent.
 *
 * <p>⚠️ <b>Owner is not offered.</b> There is one owner — the workspace's
 * billing and deletion authority — and it is transferred, never granted. A
 * picker that lets you invite a second one is a picker that will eventually be
 * asked which of them is real.
 */

/** ⚠️ Excludes Owner by construction rather than by filtering a longer list. */
const invitableRoles: readonly { value: Exclude<UserRole, "Owner">; label: string; description: string }[] = [
  { value: "Admin", label: "Admin", description: "Everything except billing." },
  { value: "Manager", label: "Manager", description: "Clients and renewals." },
];

/**
 * Good enough to catch a typo, deliberately not more.
 *
 * <p>⚠️ No attempt at RFC 5322. The addresses that matter are the ones a
 * mailbox accepts, and the only thing that knows is the mail server; a clever
 * pattern here would reject valid addresses and still pass dead ones. This
 * catches "missing an @" and stops there.
 */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const existingEmails = new Set(workspaceUsers.map((user) => user.email.toLowerCase()));

export function InviteUserForm() {
  const [draft, setDraft] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [role, setRole] = useState<Exclude<UserRole, "Owner">>("Manager");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function addEmail(value: string) {
    const candidate = value.trim().replace(/,$/, "");
    if (!candidate) return;

    if (!looksLikeEmail(candidate)) {
      setError(`"${candidate}" does not look like an email address.`);
      return;
    }
    if (existingEmails.has(candidate.toLowerCase())) {
      setError(`${candidate} is already in this workspace.`);
      return;
    }
    if (emails.some((entry) => entry.toLowerCase() === candidate.toLowerCase())) {
      setError(`${candidate} is already on the list.`);
      return;
    }

    setEmails((current) => [...current, candidate]);
    setDraft("");
    setError(null);
    setSent(false);
  }

  function removeEmail(value: string) {
    setEmails((current) => current.filter((entry) => entry !== value));
    setSent(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <section>
        <h2 className="text-sm font-semibold">Who</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Add one address at a time. Enter, Tab or a comma commits each one.
        </p>

        <div className="mt-3">
          <Field>
            <FieldLabel htmlFor="invite-email">Email addresses</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="invite-email"
                type="email"
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setError(null);
                }}
                // ⚠️ Enter adds an address, it does not submit. On a form whose
                // only button sends invitations, letting Enter through would
                // mean a half-typed address firing the whole thing.
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === "," || event.key === "Tab") {
                    if (draft.trim() === "") return;
                    event.preventDefault();
                    addEmail(draft);
                  }
                }}
                // Catches the address somebody typed and then clicked away from
                // rather than silently dropping it.
                onBlur={() => {
                  if (draft.trim() !== "") addEmail(draft);
                }}
                placeholder="name@company.com"
                aria-describedby={error ? "invite-email-error" : undefined}
                aria-invalid={error ? true : undefined}
                className="h-8 text-xs"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => addEmail(draft)}
                disabled={draft.trim() === ""}
                className={cn(whiteStyle.button, "shrink-0 px-3! py-0! text-[0.65rem]! font-normal!")}
              >
                <Plus className="size-3" />
                Add
              </Button>
            </div>
          </Field>

          {error ? (
            <p id="invite-email-error" className="mt-1.5 text-[0.65rem] text-destructive">
              {error}
            </p>
          ) : null}

          {emails.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {emails.map((email) => (
                <li key={email}>
                  <span className="inline-flex items-center gap-1 rounded-full border bg-muted/40 py-1 pr-1 pl-2.5 text-[0.7rem]">
                    {email}
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      aria-label={`Remove ${email}`}
                      className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <X className="size-3" aria-hidden />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[0.65rem] text-muted-foreground">
              Nobody added yet.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold">What they can do</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Everyone in this invitation gets the same role. You can change it
          afterwards.
        </p>

        {/* Cards rather than a select: there are two of them, the difference
            between them is the whole decision, and a dropdown would hide the
            descriptions behind a click. */}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {invitableRoles.map((option) => {
            const checked = role === option.value;

            return (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors",
                  checked ? "border-primary bg-muted/40" : "hover:bg-muted/40",
                )}
              >
                <input
                  type="radio"
                  name="invite-role"
                  value={option.value}
                  checked={checked}
                  onChange={() => setRole(option.value)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full border",
                    checked ? "border-primary bg-primary" : "border-input",
                  )}
                >
                  {checked ? (
                    <span className="size-1.5 rounded-full" style={{ background: "var(--primary-foreground)" }} />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-medium">{option.label}</span>
                  <span className="mt-0.5 block text-[0.7rem] leading-relaxed text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <p className="mt-2 text-[0.65rem] leading-relaxed text-muted-foreground">
          Owner is not on this list. A workspace has one, and it is handed over
          rather than given out.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Message</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Added to the invitation email. Optional.
        </p>

        <div className="mt-3">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Anything they should know before they accept."
            rows={4}
            aria-label="Message to include"
            className="text-xs"
          />
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-end gap-3 border-t pt-4">
        {/* ⚠️ "Prepared", not "Sent". No mail leaves the browser yet, and a
            confirmation that claims otherwise means somebody waits for a reply
            that was never requested. */}
        {sent ? (
          <p className="mr-auto flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
            <Check className="size-3 text-emerald-600" aria-hidden />
            {emails.length} invitation{emails.length === 1 ? "" : "s"} prepared — sending is not connected yet.
          </p>
        ) : (
          <p className="mr-auto text-[0.65rem] text-muted-foreground">
            {emails.length === 0
              ? "Add at least one address."
              : `${emails.length} ${emails.length === 1 ? "person" : "people"} will be invited as ${role}.`}
          </p>
        )}

        <Button size="sm" variant="outline" render={<Link href="/users" />} className="h-7 px-3 text-[0.65rem] font-normal">
          Cancel
        </Button>

        <Button
          type="button"
          size="sm"
          disabled={emails.length === 0}
          onClick={() => setSent(true)}
          className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}
        >
          <Send className="size-3" />
          Send {emails.length > 0 ? emails.length : ""} invitation{emails.length === 1 ? "" : "s"}
        </Button>
      </footer>

      {/* A reminder of what the role means, where the decision was made. */}
      <p className="sr-only">
        Selected role: {role}. <Badge>{role}</Badge>
      </p>
    </div>
  );
}
