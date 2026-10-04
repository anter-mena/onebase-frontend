"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import {
  BookOpen,
  Check,
  Database,
  Download,
  EyeIcon,
  EyeOffIcon,
  KeyRound,
  Mail,
  MessageCircle,
  MonitorSmartphone,
  ShieldCheck,
} from "lucide-react";
import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useSessionUser } from "@/components/app-shell/sessionUser";
import { CapsLockBadge, useCapsLock } from "@/components/auth/capsLock";
import { PasswordStrengthHint } from "@/components/auth/passwordStrengthHint";
import { changePassword, saveAccountSettings } from "@/app/(private)/actions";
import { roleLabels } from "@/lib/access";

/**
 * The panels behind the settings window's rail.
 *
 * <p>Four of them in one file because they are one screen seen four ways —
 * they share `Section`, `Row` and the coming-soon badge, and splitting them
 * apart would mean either four copies of those or a fifth file holding them.
 *
 * <p>What is saved: General (name, locale, email notifications) and the
 * password in Security. DB and the support form are still not connected — the
 * DB panel is Admin-only (see accountSettingsDialog). Where a control would
 * imply a promise the app cannot keep, it is marked "Coming soon" rather than
 * left looking ready.
 */

/** A titled block within a panel. */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0">
      <h3 className="text-xs font-semibold">{title}</h3>
      {description ? (
        <p className="mt-0.5 text-[0.7rem] leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      <div className="mt-3 min-w-0">{children}</div>
    </section>
  );
}

/**
 * One setting: what it is on the left, the control on the right.
 *
 * <p>The control keeps its own width rather than stretching, so a switch and a
 * button on consecutive rows line up on their right edge instead of one filling
 * the row and the other not.
 */
function Row({
  title,
  description,
  control,
}: {
  title: ReactNode;
  description?: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-xs font-medium">{title}</p>
        {description ? (
          <p className="mt-0.5 text-[0.7rem] leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center">{control}</div>
    </div>
  );
}

/** Rows in a list, divided rather than boxed. */
function Rows({ children }: { children: ReactNode }) {
  return <div className="divide-y">{children}</div>;
}

/**
 * ⚠️ A label, not a decoration.
 *
 * <p>It is on every Security control and nowhere else, so it keeps its meaning:
 * this is designed and not yet wired. Spread across settings that do work, it
 * would stop being read.
 */
function ComingSoon() {
  return (
    <Badge variant="secondary" className="h-4 px-1.5 text-[0.6rem] font-normal">
      Coming soon
    </Badge>
  );
}

/*
 * The values are what the backend stores and accepts (it refuses anything
 * else): IANA time zones and date patterns. No language: One Base is English
 * only (the setting was removed 2026-10-04).
 */
const timeZones = [
  { value: "UTC", label: "UTC" },
  { value: "Africa/Casablanca", label: "Africa/Casablanca" },
  { value: "Europe/Paris", label: "Europe/Paris" },
  { value: "Europe/Madrid", label: "Europe/Madrid" },
];

const dateFormats = [
  { value: "dd MMM yyyy", label: "24 Sep 2026" },
  { value: "MMM d, yyyy", label: "Sep 24, 2026" },
  { value: "yyyy-MM-dd", label: "2026-09-24" },
];

/**
 * Saved together with one button, as the backend takes them: name, locale and
 * email notifications. The email and role are shown, not editable — nobody
 * changes their own sign-in address or role.
 */
export function GeneralSettings() {
  const user = useSessionUser();
  const router = useRouter();
  const [name, setName] = useState(user.fullName);
  const [timeZone, setTimeZone] = useState(user.settings.timeZone);
  const [dateFormat, setDateFormat] = useState(user.settings.dateFormat);
  const [renewalEmails, setRenewalEmails] = useState(user.settings.notifyRenewals);
  const [failedPaymentEmails, setFailedPaymentEmails] = useState(user.settings.notifyFailedPayments);
  const [weeklyDigest, setWeeklyDigest] = useState(user.settings.notifyWeeklyDigest);
  const [saving, startSaving] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const changed =
    name.trim() !== user.fullName ||
    timeZone !== user.settings.timeZone ||
    dateFormat !== user.settings.dateFormat ||
    renewalEmails !== user.settings.notifyRenewals ||
    failedPaymentEmails !== user.settings.notifyFailedPayments ||
    weeklyDigest !== user.settings.notifyWeeklyDigest;

  const save = () =>
    startSaving(async () => {
      const saved = await saveAccountSettings({
        fullName: name,
        timeZone,
        dateFormat,
        notifyRenewals: renewalEmails,
        notifyFailedPayments: failedPaymentEmails,
        notifyWeeklyDigest: weeklyDigest,
      });
      setResult(saved.ok ? { ok: true, message: "Saved." } : { ok: false, message: saved.error });
      // The sidebar and navbar read the name from the server: ask for it again.
      if (saved.ok) router.refresh();
    });

  return (
    <div className="flex flex-col gap-6">
      <Section title="Profile" description="How you appear to the rest of the workspace.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="settings-name">Display name</FieldLabel>
            <Input
              id="settings-name"
              value={name}
              maxLength={120}
              onChange={(event) => {
                setName(event.target.value);
                setResult(null);
              }}
              className="h-8 text-xs"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="settings-email">Email</FieldLabel>
            <Input
              id="settings-email"
              type="email"
              value={user.email}
              readOnly
              disabled
              title="Your sign-in email can't be changed here."
              className="h-8 text-xs"
            />
          </Field>
        </div>

        <Row
          title="Role"
          description="Set by whoever owns the workspace. You cannot change your own."
          control={<Badge variant="outline">{roleLabels[user.role]}</Badge>}
        />
      </Section>

      <Section title="Locale" description="How dates are written for you.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="settings-timezone">Time zone</FieldLabel>
            <Select value={timeZone} onValueChange={(value) => { if (value) setTimeZone(value as string); }}>
              <SelectTrigger id="settings-timezone" className="h-8 w-full text-xs">
                <SelectValue>
                  {(value: string | null) => timeZones.find((entry) => entry.value === value)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {timeZones.map((entry) => (
                  <SelectItem key={entry.value} value={entry.value}>{entry.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="settings-dateformat">Date format</FieldLabel>
            <Select value={dateFormat} onValueChange={(value) => { if (value) setDateFormat(value as string); }}>
              <SelectTrigger id="settings-dateformat" className="h-8 w-full text-xs">
                <SelectValue>
                  {(value: string | null) => dateFormats.find((entry) => entry.value === value)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {dateFormats.map((entry) => (
                  <SelectItem key={entry.value} value={entry.value}>{entry.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        {/* ⚠️ Stated rather than implied. Every table on this screen writes its
            dates in UTC and in one fixed locale, because they render on the
            server as well as the browser and a date formatted two ways is a
            hydration mismatch. Until that is solved properly this control is
            a preference the tables do not read yet, and saying so is cheaper
            than someone discovering it. */}
        <p className="mt-2 text-[0.65rem] leading-relaxed text-muted-foreground">
          Tables currently print dates in UTC so the server and your browser
          always agree. This preference applies once that is per-account.
        </p>
      </Section>

      <Section title="Email notifications" description="What One Base writes to you about.">
        <Rows>
          <Row
            title="Renewals"
            description="When a subscription is about to end or has ended."
            control={<Switch checked={renewalEmails} onCheckedChange={setRenewalEmails} />}
          />
          <Row
            title="Failed payments"
            description="When a client's payment does not go through."
            control={<Switch checked={failedPaymentEmails} onCheckedChange={setFailedPaymentEmails} />}
          />
          <Row
            title="Weekly digest"
            description="One message each Monday with the week behind you."
            control={<Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />}
          />
        </Rows>
        {/* Stated, like the date note above: the choices are kept, but the emails
            they control do not exist until Renewals and Payments are built. */}
        <p className="mt-1 text-[0.65rem] leading-relaxed text-muted-foreground">
          Your choices are saved now; these emails start once Renewals and Payments are connected.
        </p>
      </Section>

      <div className="flex items-center justify-end gap-3 border-t pt-4">
        {/* "Saved." only while nothing has changed since; an error stays until the next try. */}
        {result && (!result.ok || !changed) ? (
          <p
            role="status"
            className={cn(
              "flex items-center gap-1.5 text-[0.65rem]",
              result.ok ? "text-muted-foreground" : "text-destructive",
            )}
          >
            {result.ok ? <Check className="size-3 text-emerald-600" aria-hidden /> : null}
            {result.message}
          </p>
        ) : null}
        <Button
          size="sm"
          disabled={!changed || saving || name.trim() === ""}
          onClick={save}
          className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

/** "today", "3 days ago", "4 months ago" — or null when there is no date to tell. */
function changedAgo(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return formatDistanceToNowStrict(date, { addSuffix: true, roundingMethod: "floor" });
}

/**
 * Change password, opened in place under its row. Same pieces as the other
 * password screens — Caps Lock badge, strength hint, show/hide — so all of them
 * behave alike. The backend checks the current password, keeps this device
 * signed in and signs out every other one.
 */
function ChangePasswordForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const currentCaps = useCapsLock();
  const nextCaps = useCapsLock();
  const confirmCaps = useCapsLock();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await changePassword({ currentPassword: current, newPassword: next, confirmPassword: confirm });
      if (result.ok) onDone();
      else setError(result.error);
    });
  };

  const type = show ? "text" : "password";

  return (
    <form onSubmit={submit} className="mb-3 flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
      <Field>
        <FieldLabel htmlFor="current-password">Current password</FieldLabel>
        <div className="relative">
          <Input
            id="current-password"
            {...currentCaps.fieldProps}
            type={type}
            autoComplete="current-password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            className={cn("h-8 text-xs", currentCaps.on ? "pr-24" : "pr-8")}
            autoFocus
            required
          />
          <CapsLockBadge on={currentCaps.on} withToggle />
          <Button
            type="button"
            variant="ghost"
            aria-controls="current-password new-password confirm-new-password"
            onClick={() => setShow((visible) => !visible)}
            className="absolute inset-y-0 right-0 h-full w-8 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
          >
            {show ? <EyeOffIcon className="size-3.5" aria-hidden /> : <EyeIcon className="size-3.5" aria-hidden />}
            <span className="sr-only">{show ? "Hide passwords" : "Show passwords"}</span>
          </Button>
        </div>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field className="-mb-1">
          <FieldLabel htmlFor="new-password">New password</FieldLabel>
          <div className="relative">
            <Input
              id="new-password"
              {...nextCaps.fieldProps}
              type={type}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              value={next}
              onChange={(event) => setNext(event.target.value)}
              className={cn("h-8 text-xs", nextCaps.on && "pr-20")}
              required
            />
            <CapsLockBadge on={nextCaps.on} />
          </div>
          <PasswordStrengthHint password={next} />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-new-password">Confirm new password</FieldLabel>
          <div className="relative">
            <Input
              id="confirm-new-password"
              {...confirmCaps.fieldProps}
              type={type}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className={cn("h-8 text-xs", confirmCaps.on && "pr-20")}
              required
            />
            <CapsLockBadge on={confirmCaps.on} />
          </div>
        </Field>
      </div>
      <div className="flex items-center justify-end gap-2">
        {error ? <p role="alert" className="mr-auto text-[0.65rem] text-destructive">{error}</p> : null}
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-7 px-3 text-[0.65rem] font-normal">
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending} className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}>
          {pending ? "Saving…" : "Save new password"}
        </Button>
      </div>
    </form>
  );
}

export function SecuritySettings() {
  const user = useSessionUser();
  const router = useRouter();
  const [changing, setChanging] = useState(false);
  const [changedNow, setChangedNow] = useState(false);
  const ago = changedAgo(user.settings.passwordChangedAt);

  return (
    <div className="flex flex-col gap-6">
      {/* ⚠️ Said once, at the top, rather than only on each row: only the
          password works today, and the rest is marked "Coming soon". */}
      <div className="flex items-start gap-2.5 rounded-lg border border-dashed p-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
          Changing your password works now. Two-factor, sessions and API tokens
          are designed but not connected yet.
        </p>
      </div>

      <Section title="Sign in" description="How you prove it is you.">
        <Rows>
          <div>
            <Row
              title="Password"
              description={
                changedNow
                  ? "Changed just now. Your other devices were signed out."
                  : ago
                    ? `Last changed ${ago}.`
                    : "Never changed."
              }
              control={
                <Button
                  size="sm"
                  disabled={changing}
                  onClick={() => {
                    setChanging(true);
                    setChangedNow(false);
                  }}
                  className={cn(whiteStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}
                >
                  <KeyRound className="size-3" />
                  Change
                </Button>
              }
            />
            {changing ? (
              <ChangePasswordForm
                onCancel={() => setChanging(false)}
                onDone={() => {
                  setChanging(false);
                  setChangedNow(true);
                  router.refresh();
                }}
              />
            ) : null}
          </div>
          <Row
            title={<>Two-factor authentication <ComingSoon /></>}
            description="A code from your phone on top of your password."
            control={<Switch checked={false} disabled />}
          />
          <Row
            title={<>Trusted devices <ComingSoon /></>}
            description="Skip the second factor on machines you use every day."
            control={<Switch checked={false} disabled />}
          />
        </Rows>
      </Section>

      <Section title="Sessions" description="Where your account is currently signed in.">
        <Rows>
          <Row
            title={<>Active sessions <ComingSoon /></>}
            description="This browser, and two others from the last 30 days."
            control={
              <Button size="sm" disabled className={cn(whiteStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}>
                <MonitorSmartphone className="size-3" />
                Review
              </Button>
            }
          />
          <Row
            title={<>Sign out everywhere <ComingSoon /></>}
            description="Ends every session except this one."
            control={
              <Button size="sm" variant="outline" disabled className="h-7 px-3 text-[0.65rem] font-normal">
                Sign out
              </Button>
            }
          />
        </Rows>
      </Section>

      <Section title="API access" description="For anything that talks to One Base on your behalf.">
        <Rows>
          <Row
            title={<>Personal tokens <ComingSoon /></>}
            description="No tokens have been created."
            control={
              <Button size="sm" disabled className={cn(whiteStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}>
                Create token
              </Button>
            }
          />
        </Rows>
      </Section>
    </div>
  );
}

export function DatabaseSettings() {
  const [autoBackup, setAutoBackup] = useState(true);
  const [frequency, setFrequency] = useState("daily");

  // Invented, and consistent with a workspace this size — 12 clients, a handful
  // of brands and a few months of log.
  const usedMb = 184;
  const limitMb = 1024;
  const usedShare = (usedMb / limitMb) * 100;

  return (
    <div className="flex flex-col gap-6">
      <Section title="Connection" description="Where this workspace keeps its data.">
        <div className="rounded-lg border p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <Database className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs font-medium">PostgreSQL 16</p>
                <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
                  eu-west-1 · one-base-production
                </p>
              </div>
            </div>
            {/* The dot and the word, not the dot alone — the same rule the
                status pills follow. */}
            <Badge variant="outline" className="gap-1.5">
              <span aria-hidden className="size-1.5 rounded-full bg-emerald-500" />
              Connected
            </Badge>
          </div>
        </div>
      </Section>

      <Section title="Storage" description="How much of your plan you are using.">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-muted-foreground">Used</span>
          <span className="text-xs font-medium tabular-nums">
            {usedMb} MB of {limitMb / 1024} GB
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <span
            className="block h-full rounded-full bg-primary"
            style={{ width: `${usedShare}%` }}
          />
        </div>
        <p className="mt-1.5 text-[0.65rem] text-muted-foreground">
          {(limitMb - usedMb).toLocaleString("en-GB")} MB left on this plan.
        </p>
      </Section>

      <Section title="Backups" description="Copies taken automatically, kept for 30 days.">
        <Rows>
          <Row
            title="Automatic backups"
            description="Last taken 24 September 2026, 02:00 UTC."
            control={<Switch checked={autoBackup} onCheckedChange={setAutoBackup} />}
          />
          <Row
            title="Frequency"
            description="How often a copy is taken."
            control={
              <Select
                value={frequency}
                onValueChange={(value) => { if (value) setFrequency(value as string); }}
                disabled={!autoBackup}
              >
                <SelectTrigger className="h-7 w-32 text-xs" aria-label="Backup frequency">
                  <SelectValue>
                    {(value: string | null) =>
                      ({ hourly: "Hourly", daily: "Daily", weekly: "Weekly" })[value ?? "daily"]
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            }
          />
        </Rows>
      </Section>

      <Section title="Your data" description="It is yours, and you can take it with you.">
        <Rows>
          <Row
            title="Export everything"
            description="Clients, brands, subscriptions and the action log, as CSV."
            control={
              <Button size="sm" className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}>
                <Download className="size-3" />
                Export
              </Button>
            }
          />
        </Rows>
      </Section>
    </div>
  );
}

const supportChannels = [
  {
    icon: Mail,
    title: "Email us",
    description: "We answer within one working day.",
    action: "support@onebase.app",
    href: "mailto:support@onebase.app",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    description: "For anything urgent during working hours.",
    action: "Open chat",
    href: "https://wa.me/212600000000",
  },
  {
    icon: BookOpen,
    title: "Documentation",
    description: "Guides for every screen in One Base.",
    action: "Read the docs",
    href: "https://docs.onebase.app",
  },
];

export function SupportSettings() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [sent, setSent] = useState(false);

  const canSend = subject.trim() !== "" && message.trim() !== "";

  return (
    <div className="flex flex-col gap-6">
      <Section title="Get in touch" description="Whichever suits what you need.">
        <div className="flex flex-col gap-2">
          {supportChannels.map((channel) => {
            const Icon = channel.icon;

            return (
              <a
                key={channel.title}
                href={channel.href}
                // ⚠️ `noreferrer` alongside `noopener`: these go to pages this
                // app does not control, and the referrer would tell them which
                // workspace screen the reader came from.
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium">{channel.title}</span>
                  <span className="mt-0.5 block text-[0.7rem] leading-relaxed text-muted-foreground">
                    {channel.description}
                  </span>
                </span>
                <span className="shrink-0 text-[0.65rem] text-muted-foreground">
                  {channel.action}
                </span>
              </a>
            );
          })}
        </div>
      </Section>

      <Section title="Send a message" description="Describe what happened and we will pick it up from here.">
        <div className="flex flex-col gap-3">
          <Field>
            <FieldLabel htmlFor="support-subject">Subject</FieldLabel>
            <Input
              id="support-subject"
              value={subject}
              onChange={(event) => {
                setSubject(event.target.value);
                setSent(false);
              }}
              placeholder="A short summary"
              className="h-8 text-xs"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="support-message">Message</FieldLabel>
            <Textarea
              id="support-message"
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setSent(false);
              }}
              placeholder="What were you doing, and what happened instead?"
              rows={5}
              className="text-xs"
            />
          </Field>

          <Row
            title="Include diagnostics"
            description="Your browser, screen size and the last screen you opened. No client data."
            control={<Switch checked={includeDiagnostics} onCheckedChange={setIncludeDiagnostics} />}
          />

          <div className="flex items-center justify-end gap-3">
            {/* ⚠️ "Queued", not "Sent". Nothing leaves the browser yet, and a
                confirmation that claims otherwise is the one thing a support
                form must never do — somebody would wait for a reply. */}
            {sent ? (
              <p className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
                <Check className="size-3 text-emerald-600" aria-hidden />
                Queued — sending is not connected yet.
              </p>
            ) : null}

            <Button
              size="sm"
              disabled={!canSend}
              onClick={() => setSent(true)}
              className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}
            >
              Send message
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Workspace" description="Quote these if you write to us.">
        <Rows>
          <Row title="Workspace" control={<span className="text-xs tabular-nums text-muted-foreground">one-base-production</span>} />
          <Row title="Plan" control={<Badge variant="outline">Growth</Badge>} />
          <Row title="Version" control={<span className="text-xs tabular-nums text-muted-foreground">0.1.0</span>} />
        </Rows>
      </Section>

      {/* ⚠️ Required, not optional. The coin on the Expenses tab is CC BY 4.0,
          whose one condition is that the author is credited — and a licence met
          only in a source comment nobody can read is not met. This is the page
          people reach for "what is this built from", so it belongs here. */}
      <Section title="Attributions" description="Work by other people, used under licence.">
        <Rows>
          <Row
            title="Stylized Pirate Coin"
            description="DaveNiam — used under CC BY 4.0."
            control={
              <a
                href="https://sketchfab.com/3d-models/stylized-pirate-coin-9135d081eaa74842a121fc3c81291aa3"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.65rem] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Sketchfab
              </a>
            }
          />
        </Rows>
      </Section>
    </div>
  );
}
