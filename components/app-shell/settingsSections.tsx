"use client";

import { useState, type ReactNode } from "react";
import {
  BookOpen,
  Check,
  Database,
  Download,
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

/**
 * The panels behind the settings window's rail.
 *
 * <p>Four of them in one file because they are one screen seen four ways —
 * they share `Section`, `Row` and the coming-soon badge, and splitting them
 * apart would mean either four copies of those or a fifth file holding them.
 *
 * <p>⚠️ Nothing here is persisted. The controls move because a control that
 * cannot be moved tells you nothing about the design, but the values live for
 * as long as the window is open and no longer — the window unmounts on close by
 * design. Where a control would imply a promise the app cannot keep, it is
 * marked "Coming soon" rather than left looking ready.
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

const languages = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "ar", label: "العربية" },
];

const timeZones = [
  { value: "utc", label: "UTC" },
  { value: "casablanca", label: "Africa/Casablanca" },
  { value: "paris", label: "Europe/Paris" },
  { value: "madrid", label: "Europe/Madrid" },
];

const dateFormats = [
  { value: "dmy", label: "24 Sep 2026" },
  { value: "mdy", label: "Sep 24, 2026" },
  { value: "iso", label: "2026-09-24" },
];

export function GeneralSettings() {
  const [name, setName] = useState("Admin User");
  const [email, setEmail] = useState("admin@onebase.app");
  const [language, setLanguage] = useState("en");
  const [timeZone, setTimeZone] = useState("casablanca");
  const [dateFormat, setDateFormat] = useState("dmy");
  const [renewalEmails, setRenewalEmails] = useState(true);
  const [failedPaymentEmails, setFailedPaymentEmails] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <Section title="Profile" description="How you appear to the rest of the workspace.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="settings-name">Display name</FieldLabel>
            <Input
              id="settings-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-8 text-xs"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="settings-email">Email</FieldLabel>
            <Input
              id="settings-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-8 text-xs"
            />
          </Field>
        </div>

        <Row
          title="Role"
          description="Set by whoever owns the workspace. You cannot change your own."
          control={<Badge variant="outline">Owner</Badge>}
        />
      </Section>

      <Section title="Locale" description="How dates and numbers are written for you.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="settings-language">Language</FieldLabel>
            <Select value={language} onValueChange={(value) => { if (value) setLanguage(value as string); }}>
              <SelectTrigger id="settings-language" className="h-8 w-full text-xs">
                <SelectValue>
                  {(value: string | null) => languages.find((entry) => entry.value === value)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {languages.map((entry) => (
                  <SelectItem key={entry.value} value={entry.value}>{entry.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

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
      </Section>
    </div>
  );
}

export function SecuritySettings() {
  return (
    <div className="flex flex-col gap-6">
      {/* ⚠️ Said once, at the top, rather than only on each row. A reader who
          starts changing things should learn immediately that none of it is
          connected — not after the third disabled control. */}
      <div className="flex items-start gap-2.5 rounded-lg border border-dashed p-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
          Account security is designed but not yet wired up. Every control below
          is here so the shape is settled; none of them does anything yet.
        </p>
      </div>

      <Section title="Sign in" description="How you prove it is you.">
        <Rows>
          <Row
            title={<>Password <ComingSoon /></>}
            description="Last changed 4 months ago."
            control={
              <Button size="sm" disabled className={cn(whiteStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}>
                <KeyRound className="size-3" />
                Change
              </Button>
            }
          />
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
