"use client";

import type { DragEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type {
  Categories,
  CategoryIcons,
  EmojiClickData,
  EmojiStyle,
} from "emoji-picker-react";
import {
  Apple,
  BusFront,
  CheckCheck,
  ChevronLeft,
  Clock3,
  Dog,
  FileUp,
  Flag,
  Heart,
  History,
  ListFilter,
  Info,
  Lightbulb,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Search,
  Send,
  Smile,
  X,
} from "lucide-react";
import { cn } from "cn";

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

type Conversation = {
  id: number;
  name: string;
  initials: string;
  color: string;
  preview: string;
  time: string;
  unread?: number;
  online?: boolean;
};

type ConversationFilter = "all" | "read" | "unread";

const conversations: Conversation[] = [
  {
    id: 1,
    name: "Amine El Idrissi",
    initials: "AE",
    color: "bg-emerald-100 text-emerald-800",
    preview: "Perfect, thank you for the update!",
    time: "10:42",
    unread: 2,
    online: true,
  },
  {
    id: 2,
    name: "Sarah Benali",
    initials: "SB",
    color: "bg-violet-100 text-violet-800",
    preview: "Can you send me the new package?",
    time: "09:18",
    unread: 1,
  },
  {
    id: 3,
    name: "Youssef Alaoui",
    initials: "YA",
    color: "bg-amber-100 text-amber-800",
    preview: "The renewal is confirmed.",
    time: "Yesterday",
  },
  {
    id: 4,
    name: "Lina Zahra",
    initials: "LZ",
    color: "bg-sky-100 text-sky-800",
    preview: "Thanks, I will check it today.",
    time: "Yesterday",
  },
  {
    id: 5,
    name: "Omar Naciri",
    initials: "ON",
    color: "bg-rose-100 text-rose-800",
    preview: "Could we move our call to Friday?",
    time: "Monday",
  },
];

function Avatar({ conversation }: { conversation: Conversation }) {
  return (
    <span
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center rounded-xl text-[0.65rem] font-semibold",
        conversation.color,
      )}
    >
      {conversation.initials}
      {conversation.online ? (
        <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-background bg-emerald-500" />
      ) : null}
    </span>
  );
}

export function InboxWorkspace() {
  const [activeId, setActiveId] = useState(1);
  const [query, setQuery] = useState("");
  const [conversationFilter, setConversationFilter] =
    useState<ConversationFilter>("all");
  const [showDetails, setShowDetails] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [message, setMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const isMobile = useIsMobile();
  const dragDepth = useRef(0);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const activeConversation =
    conversations.find((conversation) => conversation.id === activeId) ??
    conversations[0];

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const matchesQuery =
        !normalizedQuery ||
        conversation.name.toLowerCase().includes(normalizedQuery);
      const matchesFilter =
        conversationFilter === "all" ||
        (conversationFilter === "unread" && Boolean(conversation.unread)) ||
        (conversationFilter === "read" && !conversation.unread);

      return matchesQuery && matchesFilter;
    });
  }, [conversationFilter, query]);

  useEffect(() => {
    if (!showEmojiPicker) return;

    function handlePointerDown(event: PointerEvent) {
      if (!emojiPickerRef.current?.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
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

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!event.dataTransfer.types.includes("Files")) return;

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
                3 unread messages
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Filter conversations"
                    className={cn(
                      conversationFilter !== "all" &&
                        "bg-muted text-foreground",
                    )}
                  />
                }
              >
                <ListFilter className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32 min-w-32">
                <DropdownMenuRadioGroup
                  value={conversationFilter}
                  onValueChange={(value) =>
                    setConversationFilter(value as ConversationFilter)
                  }
                >
                  <DropdownMenuRadioItem value="all" className="text-xs">
                    All
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="read" className="text-xs">
                    Read
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="unread" className="text-xs">
                    Unread
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search conversations"
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
                  onClick={() => {
                    setActiveId(conversation.id);
                    setShowMobileChat(true);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2.5 text-left transition-colors",
                    active
                      ? "border-border bg-background shadow-sm"
                      : "hover:bg-muted/70",
                  )}
                >
                  <Avatar conversation={conversation} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-xs font-semibold">
                        {conversation.name}
                      </span>
                      <span className="ml-auto shrink-0 text-[0.6rem] text-muted-foreground">
                        {conversation.time}
                      </span>
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <span className="truncate text-[0.65rem] text-muted-foreground">
                        {conversation.preview}
                      </span>
                      {conversation.unread ? (
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
                No conversations found.
              </div>
            ) : null}
          </div>
        </div>
      </aside>
  );

  const chatPanel = (
    <div className="relative flex h-full min-h-0 min-w-0 overflow-hidden">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
        <header className="flex h-14 shrink-0 items-center gap-2.5 border-b px-4">
          <Button
            variant="ghost"
            size="icon-sm"
            className="-ml-1 md:hidden"
            aria-label="Back to conversations"
            onClick={() => {
              setShowDetails(false);
              setShowMobileChat(false);
            }}
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Avatar conversation={activeConversation} />
          <div className="min-w-0">
            <h2 className="truncate text-xs font-semibold">
              {activeConversation.name}
            </h2>
            <p className="mt-0.5 text-[0.65rem] text-emerald-600">
              {activeConversation.online ? "Online now" : "WhatsApp client"}
            </p>
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
            <Button variant="ghost" size="icon-sm" aria-label="Conversation options">
              <MoreHorizontal className="size-3.5" />
            </Button>
          </div>
        </header>

        <div
          className="relative min-h-0 flex-1 overflow-y-auto bg-muted/30 px-4 py-5 [scrollbar-gutter:stable] lg:px-8"
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
              <p className="mt-3 text-sm font-semibold">Drop files to send</p>
              <p className="mt-1 text-[0.65rem] text-muted-foreground">
                Documents, images, and videos
              </p>
            </div>
          </div>
          <div className="relative z-10 mx-auto flex min-h-full max-w-3xl flex-col justify-end gap-3">
            <div className="my-1 flex justify-center">
              <span className="rounded-full border bg-background px-2.5 py-1 text-[0.6rem] text-muted-foreground shadow-sm">
                Today
              </span>
            </div>

            <div className="flex max-w-[78%] items-end gap-2 self-start">
              <Avatar conversation={activeConversation} />
              <div>
                <div className="rounded-2xl rounded-bl-md border bg-background px-3.5 py-2.5 text-xs leading-relaxed shadow-sm">
                  Hi! I wanted to check if my current subscription renews this
                  week.
                </div>
                <p className="mt-1 pl-1 text-[0.6rem] text-muted-foreground">
                  10:31
                </p>
              </div>
            </div>

            <div className="max-w-[78%] self-end">
              <div className="rounded-2xl rounded-br-md bg-foreground px-3.5 py-2.5 text-xs leading-relaxed text-background shadow-sm">
                Hello Amine! Yes, your plan renews this Friday. Everything is
                active and ready.
              </div>
              <p className="mt-1 flex items-center justify-end gap-1 pr-1 text-[0.6rem] text-muted-foreground">
                10:38 <CheckCheck className="size-3 text-emerald-600" />
              </p>
            </div>

            <div className="flex max-w-[78%] items-end gap-2 self-start">
              <span className="size-9 shrink-0" aria-hidden />
              <div>
                <div className="rounded-2xl rounded-bl-md border bg-background px-3.5 py-2.5 text-xs leading-relaxed shadow-sm">
                  Perfect, thank you for the update!
                </div>
                <p className="mt-1 pl-1 text-[0.6rem] text-muted-foreground">
                  10:42
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="shrink-0 border-t bg-background p-3">
          <div className="mx-auto flex max-w-3xl items-end gap-1.5 rounded-xl border bg-muted/20 p-1.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
            <Button variant="ghost" size="icon-sm" aria-label="Attach file">
              <Paperclip className="size-3.5" />
            </Button>
            <textarea
              rows={1}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write a message..."
              aria-label="Message"
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
                onClick={() => setShowEmojiPicker((open) => !open)}
              >
                <Smile className="size-3.5" />
              </Button>
            </div>
            <Button
              size="icon-sm"
              className={cn(blackStyle.button, "p-0!")}
              aria-label="Send message"
            >
              <Send className="size-3" />
            </Button>
          </div>
        </footer>
      </section>

      <aside
        className={cn(
          "absolute inset-y-0 right-0 z-20 block min-h-0 shrink-0 overflow-hidden border-l bg-background shadow-xl transition-[width,transform,opacity] duration-300 ease-in-out md:static md:translate-x-0 md:shadow-none",
          showDetails
            ? "w-full translate-x-0 opacity-100 sm:w-60 md:w-60"
            : "pointer-events-none w-0 translate-x-full opacity-0 md:translate-x-0",
        )}
        aria-hidden={!showDetails}
        inert={!showDetails}
      >
        <div className="flex h-full w-full min-w-60 min-h-0 flex-col bg-background md:bg-muted/10">
          <div className="flex h-14 shrink-0 items-center border-b px-4">
            <h2 className="text-xs font-semibold">Client details</h2>
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto"
              aria-label="Close client details"
              onClick={() => setShowDetails(false)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-gutter:stable]">
            <div className="flex flex-col items-center border-b pb-4 text-center">
              <span
                className={cn(
                  "flex size-12 items-center justify-center rounded-2xl text-xs font-semibold",
                  activeConversation.color,
                )}
              >
                {activeConversation.initials}
              </span>
              <p className="mt-2 text-xs font-semibold">
                {activeConversation.name}
              </p>
              <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                +212 6 12 34 56 78
              </p>
            </div>

            <div className="space-y-4 py-4">
              <div>
                <p className="text-[0.6rem] font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </p>
                <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[0.65rem] font-medium text-emerald-700">
                  <span className="size-1.5 rounded-full bg-emerald-500" /> Active client
                </span>
              </div>
              <div>
                <p className="text-[0.6rem] font-medium uppercase tracking-wider text-muted-foreground">
                  Current service
                </p>
                <p className="mt-1.5 text-xs font-medium">Growth package</p>
                <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                  Monthly subscription
                </p>
              </div>
              <div>
                <p className="text-[0.6rem] font-medium uppercase tracking-wider text-muted-foreground">
                  Next renewal
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium">
                  <Clock3 className="size-3.5 text-muted-foreground" /> 12 Sep 2026
                </p>
              </div>
            </div>

            <button
              type="button"
              className={cn(
                whiteStyle.button,
                "flex h-8 w-full items-center justify-center gap-1.5 p-0! text-[0.7rem]! font-medium!",
              )}
            >
              <MessageCircle className="size-3.5" /> View client profile
            </button>
          </div>
        </div>
      </aside>
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
