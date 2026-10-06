"use client";

import type { DragEvent } from "react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  Categories,
  CategoryIcons,
  EmojiClickData,
  EmojiStyle,
} from "emoji-picker-react";
import {
  AlertCircle,
  Apple,
  ArrowUpRight,
  BusFront,
  Check,
  CheckCheck,
  ChevronLeft,
  Clock3,
  Dog,
  Download,
  FileText,
  FileUp,
  Flag,
  Heart,
  History,
  ImageIcon,
  ListFilter,
  Info,
  Lightbulb,
  MessageCircle,
  Mic,
  Paperclip,
  Pause,
  Play,
  Search,
  Send,
  Smile,
  X,
} from "lucide-react";
import { cn } from "cn";

import { sendWhatsAppTemplate, sendWhatsAppText } from "@/app/(private)/whatsapp-inbox/actions";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import type { WaConversation, WaMessage } from "@/lib/whatsapp/types";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 w-72 items-center justify-center rounded-xl border bg-background text-xs text-muted-foreground shadow-xl">
      Loading emojis…
    </div>
  ),
});

function SoccerBallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m9.4 9.3 2.6-1.9 2.6 1.9-1 3.1h-3.2l-1-3.1Z" />
      <path d="m12 7.4-.7-4.3M14.6 9.3l4.1-1.4M13.6 12.4l2.6 3.5M10.4 12.4l-2.6 3.5M9.4 9.3 5.3 7.9M7.8 15.9l-3.5.2M16.2 15.9l3.5.2" />
    </svg>
  );
}

const emojiCategoryIcons: CategoryIcons = {
  ["suggested" as Categories]: <History className="size-3.5" aria-hidden />,
  ["smileys_people" as Categories]: (
    <Smile className="size-3.5" aria-hidden />
  ),
  ["animals_nature" as Categories]: <Dog className="size-3.5" aria-hidden />,
  ["food_drink" as Categories]: <Apple className="size-3.5" aria-hidden />,
  ["travel_places" as Categories]: (
    <BusFront className="size-3.5" aria-hidden />
  ),
  ["activities" as Categories]: <SoccerBallIcon />,
  ["objects" as Categories]: <Lightbulb className="size-3.5" aria-hidden />,
  ["symbols" as Categories]: <Heart className="size-3.5" aria-hidden />,
  ["flags" as Categories]: <Flag className="size-3.5" aria-hidden />,
};

/** A colour per contact, the same one every time (from the number). */
const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-800",
  "bg-violet-100 text-violet-800",
  "bg-amber-100 text-amber-800",
  "bg-sky-100 text-sky-800",
  "bg-rose-100 text-rose-800",
  "bg-teal-100 text-teal-800",
];

function colorFor(waId: string) {
  let sum = 0;
  for (const ch of waId) sum = (sum + ch.charCodeAt(0)) % 997;
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function initialsFor(conversation: WaConversation) {
  if (conversation.name === conversation.phone) return conversation.waId.slice(-2);
  const words = conversation.name.trim().split(/\s+/);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "?";
}

type ConversationFilter = "all" | "read" | "unread";

// Times in the reader's own time zone. The server (UTC) writes them first and the browser
// again in local time, so those elements carry suppressHydrationWarning.
const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "long" });
const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "10:42", "Yesterday", "Monday", "3 Oct 2026" — like WhatsApp. */
function listTime(iso: string | null, now: Date) {
  if (!iso) return "";
  const date = new Date(iso);
  if (sameDay(date, now)) return TIME.format(date);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return "Yesterday";
  if (now.getTime() - date.getTime() < 6 * 86_400_000) return WEEKDAY.format(date);
  return DAY.format(date);
}

function dayLabel(date: Date, now: Date) {
  if (sameDay(date, now)) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return "Yesterday";
  return DAY.format(date);
}

function Avatar({ conversation }: { conversation: WaConversation }) {
  return (
    <span
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center rounded-xl text-[0.65rem] font-semibold",
        colorFor(conversation.waId),
      )}
    >
      {initialsFor(conversation)}
    </span>
  );
}

/** The ticks of our messages: clock, one tick, two grey, two green, or a red "!". */
function Ticks({ message }: { message: WaMessage }) {
  switch (message.status) {
    case "SENDING":
      return <Clock3 className="size-3" aria-label="Sending" />;
    case "SENT":
      return <Check className="size-3" aria-label="Sent" />;
    case "DELIVERED":
      return <CheckCheck className="size-3" aria-label="Delivered" />;
    case "READ":
      return <CheckCheck className="size-3 text-emerald-600" aria-label="Read" />;
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-0.5 text-destructive" title={message.error ?? "Not sent"}>
          <AlertCircle className="size-3" aria-hidden /> Not sent
        </span>
      );
    default:
      return null;
  }
}

const MEDIA_LABEL: Record<string, string> = {
  IMAGE: "Photo",
  VIDEO: "Video",
  AUDIO: "Voice message",
  STICKER: "Sticker",
  DOCUMENT: "Document",
};

/** What can be shown in the chat (the media route serves only these inline). */
const SHOWABLE = /^(image\/(jpeg|png|webp)|audio\/(ogg|mpeg|mp4|aac|amr)|video\/(mp4|3gpp))/i;

/**
 * How a message's file is shown: a sticker on its own (no bubble), a photo or video
 * filling the bubble, a voice message player, or a download link.
 */
type MediaKind = "sticker" | "visual" | "audio" | "file";

function mediaKind(message: WaMessage): MediaKind | null {
  if (!message.hasMedia) return null;
  if (!SHOWABLE.test(message.mediaMime ?? "")) return "file";
  if (message.type === "STICKER") return "sticker";
  if (message.type === "IMAGE" || message.type === "VIDEO") return "visual";
  if (message.type === "AUDIO") return "audio";
  return "file";
}

function mediaSrc(message: WaMessage) {
  return `/whatsapp-inbox/media?message=${message.id}&inline=1`;
}

/** A file in a message, drawn the way WhatsApp draws it. */
function MediaLink({ message, mine }: { message: WaMessage; mine: boolean }) {
  const kind = mediaKind(message);
  const src = mediaSrc(message);
  if (kind === "sticker") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a private file from our own route
      <img src={src} alt="Sticker" className="size-36 object-contain drop-shadow-sm" />
    );
  }
  if (kind === "visual" && message.type === "IMAGE") {
    return (
      <a href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl" title="Open the photo">
        {/* eslint-disable-next-line @next/next/no-img-element -- a private file from our own route */}
        <img src={src} alt="Photo" className="max-h-80 min-h-24 w-64 max-w-full bg-muted/40 object-cover" />
      </a>
    );
  }
  if (kind === "visual") {
    return <video controls preload="metadata" src={src} className="max-h-80 w-64 max-w-full rounded-xl bg-black" aria-label="Video" />;
  }
  if (kind === "audio") return <VoiceNote src={src} seed={message.id} mine={mine} />;
  return <FileLink message={message} mine={mine} />;
}

const WAVE_BARS = 34;

/** Bar heights for the wave line: always the same for one message. */
function waveform(seed: number) {
  let x = (seed * 9301 + 49297) % 233280;
  return Array.from({ length: WAVE_BARS }, () => {
    x = (x * 9301 + 49297) % 233280;
    return 0.25 + (x / 233280) * 0.75;
  });
}

function formatSeconds(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** A voice message as on WhatsApp: a round play button, the wave line and the time. */
function VoiceNote({ src, seed, mine }: { src: string; seed: number; mine: boolean }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const bars = useMemo(() => waveform(seed), [seed]);
  const progress = duration > 0 ? Math.min(time / duration, 1) : 0;

  function toggle() {
    const element = audio.current;
    if (!element) return;
    if (element.paused) element.play().catch(() => setPlaying(false));
    else element.pause();
  }

  function seekTo(seconds: number) {
    const element = audio.current;
    if (!element || duration <= 0) return;
    element.currentTime = Math.max(0, Math.min(seconds, duration));
    setTime(element.currentTime);
  }

  function readDuration(element: HTMLAudioElement) {
    setDuration(Number.isFinite(element.duration) ? element.duration : 0);
  }

  return (
    <div className="flex w-64 max-w-full items-center gap-2.5">
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setTime(0);
        }}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => readDuration(event.currentTarget)}
        onDurationChange={(event) => readDuration(event.currentTarget)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause the voice message" : "Play the voice message"}
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
          mine ? "bg-background text-foreground hover:bg-background/85" : "bg-foreground text-background hover:bg-foreground/85",
        )}
      >
        {playing ? <Pause className="size-3.5 fill-current" /> : <Play className="ml-0.5 size-3.5 fill-current" />}
      </button>
      <div
        role="slider"
        tabIndex={0}
        aria-label="Position in the voice message"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(time)}
        aria-valuetext={formatSeconds(time)}
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          seekTo(((event.clientX - box.left) / box.width) * duration);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") seekTo(time + 5);
          if (event.key === "ArrowLeft") seekTo(time - 5);
        }}
        className="flex h-7 min-w-0 flex-1 cursor-pointer items-center gap-[2px] rounded outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        {bars.map((height, index) => (
          <span
            key={index}
            className={cn(
              "min-w-0 flex-1 rounded-full transition-colors",
              index / WAVE_BARS < progress
                ? mine ? "bg-background" : "bg-foreground"
                : mine ? "bg-background/35" : "bg-foreground/25",
            )}
            style={{ height: `${height * 100}%` }}
          />
        ))}
      </div>
      <span className={cn("shrink-0 text-[0.6rem] tabular-nums", mine ? "text-background/70" : "text-muted-foreground")}>
        {formatSeconds(playing || time > 0 ? time : duration)}
      </span>
      <Mic className={cn("size-4 shrink-0", mine ? "text-background/70" : "text-muted-foreground")} aria-hidden />
    </div>
  );
}

/** A file that is not shown in the page: a download link (it comes from a stranger). */
function FileLink({ message, mine }: { message: WaMessage; mine: boolean }) {
  const label = message.mediaFilename ?? MEDIA_LABEL[message.type] ?? "File";
  const Icon = message.type === "IMAGE" || message.type === "STICKER" ? ImageIcon : message.type === "AUDIO" ? Mic : FileText;
  return (
    <a
      href={`/whatsapp-inbox/media?message=${message.id}`}
      download
      className={cn(
        "flex max-w-64 items-center gap-2 rounded-lg border px-2.5 py-2 text-[0.7rem] transition-colors",
        mine ? "border-background/20 hover:bg-background/10" : "hover:bg-muted",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
      <Download className="size-3.5 shrink-0 opacity-70" aria-hidden />
    </a>
  );
}

/**
 * The WhatsApp Inbox, on the conversations One Base saved from Meta's webhook.
 *
 * <p>The list and the open chat come from the server (the open one is in the
 * address bar, ?c=…); every few seconds the page asks again, so new messages and
 * the ticks appear by themselves. Free text and files only within 24 hours of the
 * client's last message — after that the composer offers the approved template.
 */
export function WhatsAppInboxWorkspace({
  conversations,
  activeId,
  messages,
  connected,
  now,
}: {
  conversations: WaConversation[];
  activeId: number | null;
  messages: WaMessage[];
  connected: boolean;
  /** Fixed by the server, so times read the same on both sides of hydration. */
  now: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const today = useMemo(() => new Date(now), [now]);
  const [query, setQuery] = useState("");
  const [conversationFilter, setConversationFilter] = useState<ConversationFilter>("all");
  const [showDetails, setShowDetails] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [message, setMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startSending] = useTransition();
  const [uploading, setUploading] = useState(false);
  const isMobile = useIsMobile();
  const dragDepth = useRef(0);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((conversation) => conversation.id === activeId) ?? null;
  const showMobileChat = Boolean(activeConversation) && params.get("c") !== null;
  const totalUnread = conversations.reduce((total, conversation) => total + conversation.unread, 0);

  const filteredConversations = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const digits = needle.replace(/\D/g, "");
    return conversations.filter((conversation) => {
      const matchesQuery =
        !needle ||
        conversation.name.toLowerCase().includes(needle) ||
        (digits.length > 0 && conversation.waId.includes(digits)) ||
        (conversation.preview ?? "").toLowerCase().includes(needle);
      const matchesFilter =
        conversationFilter === "all" ||
        (conversationFilter === "unread" && conversation.unread > 0) ||
        (conversationFilter === "read" && conversation.unread === 0);
      return matchesQuery && matchesFilter;
    });
  }, [conversationFilter, conversations, query]);

  function open(id: number | null) {
    const next = new URLSearchParams(params.toString());
    if (id === null) next.delete("c");
    else next.set("c", String(id));
    setError(null);
    setShowDetails(false);
    const search = next.toString();
    router.push(search ? `${pathname}?${search}` : pathname, { scroll: false });
  }

  // New messages scroll into view, like WhatsApp.
  const lastMessageId = messages.at(-1)?.id;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lastMessageId, activeId]);

  useEffect(() => {
    if (!showEmojiPicker) return;
    function handlePointerDown(event: PointerEvent) {
      if (!emojiPickerRef.current?.contains(event.target as Node)) setShowEmojiPicker(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setShowEmojiPicker(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showEmojiPicker]);

  function send() {
    if (!activeConversation || !message.trim() || pending) return;
    const text = message;
    setError(null);
    startSending(async () => {
      const result = await sendWhatsAppText(activeConversation.id, text);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("");
      router.refresh();
    });
  }

  function sendTemplate() {
    if (!activeConversation || pending) return;
    setError(null);
    startSending(async () => {
      const result = await sendWhatsAppTemplate(activeConversation.id);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  /** A file, with what is in the box as its caption. */
  async function sendFile(file: File) {
    if (!activeConversation) return;
    if (file.size > 16 * 1024 * 1024) {
      setError("Files can be 16 MB at most.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file, file.name);
      if (message.trim()) form.append("caption", message.trim());
      const response = await fetch(`/whatsapp-inbox/file?conversation=${activeConversation.id}`, { method: "POST", body: form });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.message ?? "The file could not be sent.");
        return;
      }
      setMessage("");
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!event.dataTransfer.types.includes("Files") || !activeConversation?.windowOpen) return;
    dragDepth.current += 1;
    setDragActive(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragActive(false);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current = 0;
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file && activeConversation?.windowOpen) void sendFile(file);
  }

  function handleEmojiClick(emoji: EmojiClickData) {
    setMessage((currentMessage) => `${currentMessage}${emoji.emoji}`);
  }

  const conversationPanel = (
    <aside className="flex h-full min-h-0 flex-col bg-muted/15">
      <div className="shrink-0 border-b p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Conversations</h2>
            <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
              {totalUnread === 0 ? "No unread messages" : `${totalUnread} unread ${totalUnread === 1 ? "message" : "messages"}`}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Filter conversations"
                  className={cn(conversationFilter !== "all" && "bg-muted text-foreground")}
                />
              }
            >
              <ListFilter className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 min-w-32">
              <DropdownMenuRadioGroup value={conversationFilter} onValueChange={(value) => setConversationFilter(value as ConversationFilter)}>
                <DropdownMenuRadioItem value="all" className="text-xs">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="read" className="text-xs">Read</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="unread" className="text-xs">Unread</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, number or message"
            aria-label="Search conversations"
            className="h-8 bg-background pr-2 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-gutter:stable]">
        <div className="space-y-1">
          {filteredConversations.map((conversation) => {
            const active = conversation.id === activeId;
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => open(conversation.id)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2.5 text-left transition-colors",
                  active ? "border-border bg-background shadow-sm" : "hover:bg-muted/70",
                )}
              >
                <Avatar conversation={conversation} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={cn("truncate text-xs", conversation.unread > 0 ? "font-bold" : "font-semibold")}>{conversation.name}</span>
                    <span className="ml-auto shrink-0 text-[0.6rem] text-muted-foreground" suppressHydrationWarning>{listTime(conversation.lastMessageAt, today)}</span>
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    <span className="truncate text-[0.65rem] text-muted-foreground">{conversation.preview ?? ""}</span>
                    {conversation.unread > 0 ? (
                      <span className="ml-auto flex size-4 shrink-0 items-center justify-center rounded-full bg-foreground text-[0.55rem] font-semibold text-background">
                        {conversation.unread}
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>
            );
          })}
          {filteredConversations.length === 0 ? (
            <div className="px-3 py-8 text-center text-[0.7rem] text-muted-foreground">
              {conversations.length === 0
                ? connected
                  ? "No conversations yet. They appear here when a client writes to your WhatsApp number."
                  : "WhatsApp is not connected yet."
                : "No conversations found."}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );

  // Messages grouped by day, with the date chip between days.
  const rows: React.ReactNode[] = [];
  let lastDay = "";
  messages.forEach((entry, index) => {
    const date = new Date(entry.createdAt);
    const label = dayLabel(date, today);
    if (label !== lastDay) {
      lastDay = label;
      rows.push(
        <div key={`day-${entry.id}`} className="my-1 flex justify-center">
          <span className="rounded-full border bg-background px-2.5 py-1 text-[0.6rem] text-muted-foreground shadow-sm" suppressHydrationWarning>{label}</span>
        </div>,
      );
    }
    const mine = entry.direction === "OUT";
    const kind = mediaKind(entry);
    const body = entry.type === "TEMPLATE" ? <span className="italic">{entry.body}</span> : entry.body;
    const content =
      kind === "sticker" ? (
        <MediaLink message={entry} mine={mine} />
      ) : (
        <div
          className={cn(
            "text-xs leading-relaxed whitespace-pre-wrap break-words shadow-sm",
            mine ? "rounded-2xl rounded-br-md bg-foreground text-background" : "rounded-2xl rounded-bl-md border bg-background",
            kind === "visual" ? "p-1" : kind === "audio" ? "px-2.5 py-2" : "px-3.5 py-2.5",
            mine && entry.status === "FAILED" && "opacity-60",
          )}
        >
          {kind ? <MediaLink message={entry} mine={mine} /> : null}
          {entry.body ? (
            <div className={cn(kind === "visual" ? "px-2.5 pt-1.5 pb-1" : kind === "file" && "mt-1.5")}>{body}</div>
          ) : null}
        </div>
      );
    const previous = messages[index - 1];
    const firstOfGroup = !previous || previous.direction !== entry.direction || dayLabel(new Date(previous.createdAt), today) !== label;
    rows.push(
      mine ? (
        <div key={entry.id} className="flex max-w-[78%] flex-col items-end self-end">
          {content}
          <p className="mt-1 flex items-center justify-end gap-1 pr-1 text-[0.6rem] text-muted-foreground">
            <span suppressHydrationWarning>{TIME.format(date)}</span> <Ticks message={entry} />
          </p>
          {entry.status === "FAILED" && entry.error ? (
            <p className="mt-0.5 pr-1 text-right text-[0.6rem] text-destructive">{entry.error}</p>
          ) : null}
        </div>
      ) : (
        <div key={entry.id} className="flex max-w-[78%] items-end gap-2 self-start">
          {firstOfGroup && activeConversation ? <Avatar conversation={activeConversation} /> : <span className="size-9 shrink-0" aria-hidden />}
          <div className="min-w-0">
            {content}
            <p className="mt-1 pl-1 text-[0.6rem] text-muted-foreground" suppressHydrationWarning>{TIME.format(date)}</p>
          </div>
        </div>
      ),
    );
  });

  const busy = pending || uploading;
  const chatPanel = activeConversation ? (
    <div className="relative flex h-full min-h-0 min-w-0 overflow-hidden">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
        <header className="flex h-14 shrink-0 items-center gap-2.5 border-b px-4">
          <Button variant="ghost" size="icon-sm" className="-ml-1 md:hidden" aria-label="Back to conversations" onClick={() => open(null)}>
            <ChevronLeft className="size-3.5" />
          </Button>
          <Avatar conversation={activeConversation} />
          <div className="min-w-0">
            <h2 className="truncate text-xs font-semibold">{activeConversation.name}</h2>
            <p className="mt-0.5 text-[0.65rem] text-muted-foreground">{activeConversation.phone}</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={showDetails ? "Hide client information" : "Show client information"}
              aria-expanded={showDetails}
              onClick={() => setShowDetails((visible) => !visible)}
              className={cn(showDetails && "bg-muted text-foreground")}
            >
              <Info className="size-3.5" />
            </Button>
          </div>
        </header>

        <div
          className="relative min-h-0 flex-1 overflow-hidden bg-muted/30"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-muted-foreground opacity-[0.12]"
            style={{
              WebkitMaskImage: 'url("/whatsapp-chat-wallpaper.webp")',
              WebkitMaskRepeat: "repeat",
              WebkitMaskSize: "540px 960px",
              maskImage: 'url("/whatsapp-chat-wallpaper.webp")',
              maskRepeat: "repeat",
              maskSize: "540px 960px",
            }}
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-3 z-20 flex scale-[0.98] items-center justify-center rounded-xl border-2 border-dashed border-foreground/25 bg-background/90 opacity-0 shadow-lg backdrop-blur-sm transition-[opacity,transform] duration-200",
              dragActive && "scale-100 opacity-100",
            )}
            aria-hidden
          >
            <div className="flex flex-col items-center text-center">
              <span className="flex size-11 items-center justify-center rounded-xl border bg-background shadow-sm">
                <FileUp className="size-5" />
              </span>
              <p className="mt-3 text-sm font-semibold">Drop a file to send</p>
              <p className="mt-1 text-[0.65rem] text-muted-foreground">Photos, videos, audio and documents · 16 MB at most</p>
            </div>
          </div>
          <div className="relative z-10 h-full overflow-y-auto px-4 py-5 [scrollbar-gutter:stable] lg:px-8">
            <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-end gap-3">
              {rows}
              <div ref={bottomRef} />
            </div>
          </div>
        </div>

        <footer className="shrink-0 border-t bg-background p-3">
          {error ? (
            <p role="alert" className="mx-auto mb-2 max-w-3xl text-[0.7rem] text-destructive">
              {error}
            </p>
          ) : null}
          {activeConversation.windowOpen ? (
            <div className="mx-auto flex max-w-3xl items-end gap-1.5 rounded-xl border bg-muted/20 p-1.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
              <input
                ref={fileInput}
                type="file"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void sendFile(file);
                }}
              />
              <Button variant="ghost" size="icon-sm" aria-label="Attach file" disabled={busy} onClick={() => fileInput.current?.click()}>
                <Paperclip className="size-3.5" />
              </Button>
              <textarea
                rows={1}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  // Enter sends, Shift+Enter makes a new line — like WhatsApp on a computer.
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
                placeholder={uploading ? "Sending the file…" : "Write a message..."}
                aria-label="Message"
                maxLength={4096}
                className="max-h-24 min-h-7 flex-1 resize-none bg-transparent px-1 py-1.5 text-xs outline-none placeholder:text-muted-foreground"
              />
              <div ref={emojiPickerRef} className="relative">
                {showEmojiPicker ? (
                  <div className="absolute right-0 bottom-full z-30 mb-2 overflow-hidden rounded-xl shadow-xl">
                    <EmojiPicker
                      emojiStyle={"apple" as EmojiStyle}
                      onEmojiClick={handleEmojiClick}
                      lazyLoadEmojis
                      width={250}
                      height={270}
                      searchPlaceholder="Search emojis"
                      previewConfig={{ showPreview: false }}
                      categoryIcons={emojiCategoryIcons}
                      className="onebase-emoji-picker"
                    />
                  </div>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={showEmojiPicker ? "Close emoji picker" : "Add emoji"}
                  aria-expanded={showEmojiPicker}
                  onClick={() => setShowEmojiPicker((value) => !value)}
                >
                  <Smile className="size-3.5" />
                </Button>
              </div>
              <Button size="icon-sm" className={cn(blackStyle.button, "p-0!")} aria-label="Send message" disabled={busy || !message.trim()} onClick={send}>
                <Send className="size-3" />
              </Button>
            </div>
          ) : (
            // Outside the 24-hour window WhatsApp accepts only an approved template.
            <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 rounded-xl border bg-muted/20 px-3 py-2.5">
              <p className="min-w-0 flex-1 text-[0.7rem] text-muted-foreground">
                More than 24 hours since {activeConversation.name}&apos;s last message. WhatsApp only allows an approved template until they answer.
              </p>
              <Button size="sm" disabled={busy} onClick={sendTemplate} className={cn(blackStyle.button, "h-7 px-3! py-0! text-[0.7rem]! font-medium!")}>
                {pending ? "Sending…" : "Send template"}
              </Button>
            </div>
          )}
        </footer>
      </section>

      <aside
        className={cn(
          "absolute inset-y-0 right-0 z-20 block min-h-0 shrink-0 overflow-hidden border-l bg-background shadow-xl transition-[width,transform,opacity] duration-300 ease-in-out md:static md:translate-x-0 md:shadow-none",
          showDetails ? "w-full translate-x-0 opacity-100 sm:w-60 md:w-60" : "pointer-events-none w-0 translate-x-full opacity-0 md:translate-x-0",
        )}
        aria-hidden={!showDetails}
        inert={!showDetails}
      >
        <div className="flex h-full w-full min-w-60 min-h-0 flex-col bg-background md:bg-muted/10">
          <div className="flex h-14 shrink-0 items-center border-b px-4">
            <h2 className="text-xs font-semibold">Client details</h2>
            <Button variant="ghost" size="icon-sm" className="ml-auto" aria-label="Close client details" onClick={() => setShowDetails(false)}>
              <X className="size-3.5" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-gutter:stable]">
            <div className="flex flex-col items-center border-b pb-4 text-center">
              <span className={cn("flex size-12 items-center justify-center rounded-2xl text-xs font-semibold", colorFor(activeConversation.waId))}>
                {initialsFor(activeConversation)}
              </span>
              <p className="mt-2 text-xs font-semibold">{activeConversation.name}</p>
              <p className="mt-0.5 text-[0.65rem] text-muted-foreground">{activeConversation.phone}</p>
            </div>
            <div className="space-y-4 py-4">
              <div>
                <p className="text-[0.6rem] font-medium tracking-wider text-muted-foreground uppercase">Reply window</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium" suppressHydrationWarning>
                  <Clock3 className="size-3.5 text-muted-foreground" />
                  {activeConversation.windowOpen && activeConversation.windowEndsAt
                    ? `Open until ${TIME.format(new Date(activeConversation.windowEndsAt))}, ${dayLabel(new Date(activeConversation.windowEndsAt), today).toLowerCase()}`
                    : "Closed: template only"}
                </p>
              </div>
              <div>
                <p className="text-[0.6rem] font-medium tracking-wider text-muted-foreground uppercase">Client</p>
                {activeConversation.clientId ? (
                  <Link
                    href={`/clients/${activeConversation.clientId}`}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
                  >
                    Open client page
                    <ArrowUpRight className="size-3" aria-hidden />
                  </Link>
                ) : (
                  <p className="mt-1.5 text-[0.7rem] text-muted-foreground">Not linked to a client yet.</p>
                )}
              </div>
            </div>
            <a
              href={`https://wa.me/${activeConversation.waId}`}
              target="_blank"
              rel="noreferrer"
              className={cn(whiteStyle.button, "flex h-8 w-full items-center justify-center gap-1.5 p-0! text-[0.7rem]! font-medium!")}
            >
              <MessageCircle className="size-3.5" /> Open in WhatsApp
            </a>
          </div>
        </div>
      </aside>
    </div>
  ) : (
    <div className="flex h-full flex-col items-center justify-center gap-1 bg-muted/20 p-6 text-center">
      <MessageCircle className="size-6 text-muted-foreground" aria-hidden />
      <p className="mt-2 text-sm font-medium">No conversation open</p>
      <p className="text-xs text-muted-foreground">Choose one from the list.</p>
    </div>
  );

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      {isMobile ? (
        showMobileChat ? chatPanel : conversationPanel
      ) : (
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize="22" minSize={230} maxSize="38">
            {conversationPanel}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="78" minSize={400}>
            {chatPanel}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}
