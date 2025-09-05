import React, { useState, useRef, useEffect } from "react";
import { parseDuration } from "@alwatr/parse-duration";
import {
  Send,
  Bot,
  User,
  ChevronDown,
  AtSign,
  FileVideo,
  FileImage,
  Type,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  History,
  Trash2,
  Pencil,
  Eraser,
  CornerUpLeft,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Separator } from "~/components/ui/separator";
import { type MediaBinItem, type TimelineState, type ScrubberState } from "../timeline/types";
import { cn } from "~/lib/utils";
import axios from "axios";
import { apiUrl } from "~/utils/api";
import {
  AiResponseSchema,
  MoveScrubberArgsSchema,
  ResizeScrubberArgsSchema,
  AddScrubberByNameArgsSchema,
  AddMediaByIdArgsSchema,
  DeleteScrubbersInTrackArgsSchema,
  UpdateTextContentArgsSchema,
  UpdateTextStyleArgsSchema,
  MoveScrubbersByOffsetArgsSchema,
  ChatTabsStorageSchema,
} from "~/schemas/components/chat";

// llm tools
import {
  llmAddScrubberToTimeline,
  llmMoveScrubber,
  llmAddScrubberByName,
  llmDeleteScrubbersInTrack,
  llmResizeScrubber,
  llmUpdateTextContent,
  llmUpdateTextStyle,
  llmMoveScrubbersByOffset,
  llmSetResolution,
} from "~/utils/llm-handler";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  snapshot?: TimelineState | null;
}

interface ChatBoxProps {
  className?: string;
  mediaBinItems: MediaBinItem[];
  handleDropOnTrack: (item: MediaBinItem, trackId: string, dropLeftPx: number) => string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  messages: Message[];
  onMessagesChange: (messages: Message[]) => void;
  timelineState: TimelineState;
  handleUpdateScrubber: (updatedScrubber: ScrubberState) => void;
  handleDeleteScrubber?: (scrubberId: string) => void;
  pixelsPerSecond: number;
  handleAddTrack?: () => void;
  restoreTimeline?: (state: TimelineState) => void;
}

export function ChatBox({
  className = "",
  mediaBinItems,
  handleDropOnTrack,
  isMinimized = false,
  onToggleMinimize,
  messages,
  onMessagesChange,
  timelineState,
  handleUpdateScrubber,
  handleDeleteScrubber,
  pixelsPerSecond,
  handleAddTrack,
  restoreTimeline,
}: ChatBoxProps) {
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [showSendOptions, setShowSendOptions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [textareaHeight, setTextareaHeight] = useState(36); // Starting height for proper size
  const [sendWithMedia, setSendWithMedia] = useState(false); // Track send mode
  const [mentionedItems, setMentionedItems] = useState<MediaBinItem[]>([]); // Store actual mentioned items
  const [contextMenu, setContextMenu] = useState<{
    open: boolean;
    x: number;
    y: number;
    index: number;
    message?: Message | null;
  }>({ open: false, x: 0, y: 0, index: -1, message: null });
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [confirmRestoreIndex, setConfirmRestoreIndex] = useState<number | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [tabsMenu, setTabsMenu] = useState<{ open: boolean; x: number; y: number; tabId: string | null }>({
    open: false,
    x: 0,
    y: 0,
    tabId: null,
  });
  const headerRef = useRef<HTMLDivElement>(null);
  const [historyWidthPx, setHistoryWidthPx] = useState<number | null>(null);
  const [historyQuery, setHistoryQuery] = useState<string>("");
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState<string>("");
  const [historyEditingId, setHistoryEditingId] = useState<string | null>(null);
  const [historyEditingName, setHistoryEditingName] = useState<string>("");
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollToTabId = (id: string) => {
    const container = tabsContainerRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLButtonElement>(`[data-tab-id="${id}"]`);
    if (!el) return;
    const targetLeft = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
  };
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mentionsRef = useRef<HTMLDivElement>(null);
  const sendOptionsRef = useRef<HTMLDivElement>(null);
  const latestTimelineRef = useRef<TimelineState>(timelineState);
  const [pendingResizeRequests, setPendingResizeRequests] = useState<
    { id: string; durationSeconds: number; pixelsPerSecond: number; trackNumber: number }[]
  >([]);
  const getProjectIdFromPath = () => {
    try {
      const m = window.location.pathname.match(/\/project\/([^/]+)/);
      return m ? m[1] : "default";
    } catch {
      return "default";
    }
  };
  const PROJECT_ID = getProjectIdFromPath();
  const STORAGE_KEY = `kimu.chat.tabs.v2.${PROJECT_ID}`;
  const ACTIVE_TAB_KEY = `kimu.chat.activeTab.v2.${PROJECT_ID}`;

  const getRecencyGroup = (ts: number) => {
    const now = Date.now();
    const diff = now - ts;
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday.getTime() - oneDay);
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    if (diff <= oneHour) return "Last hour";
    if (ts >= startOfToday.getTime()) return "Today";
    if (ts >= startOfYesterday.getTime()) return "Yesterday";
    if (ts >= startOfWeek.getTime()) return "This week";
    return "Older";
  };

  type ChatTab = {
    id: string;
    name: string;
    messages: Message[];
    timelineSnapshot: TimelineState | null;
    createdAt: number;
  };

  const loadTabs = (): ChatTab[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((t: any) => ({
          id: String(t.id ?? Date.now().toString()),
          name: String(t.name ?? "Chat"),
          messages: Array.isArray(t.messages)
            ? t.messages.map((m: any) => ({
                id: String(m.id ?? Date.now().toString()),
                content: String(m.content ?? ""),
                isUser: Boolean(m.isUser),
                timestamp: m && m.timestamp ? new Date(m.timestamp) : new Date(),
              }))
            : [],
          timelineSnapshot: t.timelineSnapshot ?? null,
          createdAt: Number(t.createdAt ?? Date.now()),
        }));
      }
    } catch {}
    return [];
  };

  const [tabs, setTabs] = useState<ChatTab[]>(() => {
    const existing = loadTabs();
    if (existing.length) return existing;
    return [{ id: Date.now().toString(), name: "Chat 1", messages: [], timelineSnapshot: null, createdAt: Date.now() }];
  });
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_TAB_KEY);
      if (stored) return stored;
    } catch {}
    return tabs[0]?.id || "";
  });
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    latestTimelineRef.current = timelineState;
  }, [timelineState]);

  // Process queued resize requests once the timeline reflects new scrubbers
  useEffect(() => {
    if (!pendingResizeRequests.length) return;
    const tl = latestTimelineRef.current;
    const remaining: typeof pendingResizeRequests = [];
    for (const req of pendingResizeRequests) {
      const trackIndex = Math.max(0, req.trackNumber - 1);
      const track = tl.tracks?.[trackIndex];
      const target = track?.scrubbers.find((s) => s.id === req.id);
      if (target) {
        llmResizeScrubber(target.id, req.durationSeconds, req.pixelsPerSecond, tl, handleUpdateScrubber);
      } else {
        remaining.push(req);
      }
    }
    if (remaining.length !== pendingResizeRequests.length) {
      setPendingResizeRequests(remaining);
    }
  }, [timelineState]);

  useEffect(() => {
    if (activeTabId) {
      scrollToTabId(activeTabId);
    }
  }, [activeTabId]);

  const persistTabs = (next: ChatTab[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      localStorage.setItem(ACTIVE_TAB_KEY, activeTabId);
    } catch {}
  };

  useEffect(() => {
    persistTabs(tabs);
  }, [tabs]);

  useEffect(() => {
    const updateWidth = () => {
      if (headerRef.current) {
        const w = headerRef.current.offsetWidth;
        setHistoryWidthPx(w);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Ensure activeTabId is valid after tabs change
  useEffect(() => {
    if (!tabs.find((t) => t.id === activeTabId)) {
      setActiveTabId(tabs[0]?.id || "");
    }
  }, [tabs, activeTabId]);

  // keep ChatBox external messages prop in sync with active tab
  useEffect(() => {
    if (!activeTab) return;
    onMessagesChange(activeTab.messages);
  }, [activeTabId]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Click outside handler for send options
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sendOptionsRef.current && !sendOptionsRef.current.contains(event.target as Node)) {
        setShowSendOptions(false);
      }
    };

    if (showSendOptions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSendOptions]);

  // Filter media bin items based on mention query
  const filteredMentions = mediaBinItems.filter((item) => item.name.toLowerCase().includes(mentionQuery.toLowerCase()));

  // Handle input changes and @ mention detection
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    setInputValue(value);
    setCursorPosition(cursorPos);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 96); // max about 4 lines
    textarea.style.height = newHeight + "px";
    setTextareaHeight(newHeight);

    // Clean up mentioned items that are no longer in the text
    const mentionPattern = /@(\w+(?:\s+\w+)*)/g;
    const currentMentions = Array.from(value.matchAll(mentionPattern)).map((match) => match[1]);
    setMentionedItems((prev) =>
      prev.filter((item) => currentMentions.some((mention) => mention.toLowerCase() === item.name.toLowerCase())),
    );

    // Check for @ mentions
    const beforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = beforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const afterAt = beforeCursor.slice(lastAtIndex + 1);
      // Only show mentions if @ is at start or after whitespace, and no spaces after @
      const isValidMention = (lastAtIndex === 0 || /\s/.test(beforeCursor[lastAtIndex - 1])) && !afterAt.includes(" ");

      if (isValidMention) {
        setMentionQuery(afterAt);
        setShowMentions(true);
        setSelectedMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  // Insert mention into input
  const insertMention = (item: MediaBinItem) => {
    const beforeCursor = inputValue.slice(0, cursorPosition);
    const afterCursor = inputValue.slice(cursorPosition);
    const lastAtIndex = beforeCursor.lastIndexOf("@");

    const newValue = beforeCursor.slice(0, lastAtIndex) + `@${item.name} ` + afterCursor;
    setInputValue(newValue);
    setShowMentions(false);

    // Store the actual item reference for later use
    setMentionedItems((prev) => {
      // Avoid duplicates
      if (!prev.find((existingItem) => existingItem.id === item.id)) {
        return [...prev, item];
      }
      return prev;
    });

    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
      const newCursorPos = lastAtIndex + item.name.length + 2;
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleSendMessage = async (includeAllMedia = false) => {
    if (!inputValue.trim()) return;

    let messageContent = inputValue.trim();
    let itemsToSend = mentionedItems;

    // If sending with all media, include all media items
    if (includeAllMedia && mediaBinItems.length > 0) {
      const mediaList = mediaBinItems.map((item) => `@${item.name}`).join(" ");
      messageContent = `${messageContent} ${mediaList}`;
      // Add all media items to the items to send
      itemsToSend = [
        ...mentionedItems,
        ...mediaBinItems.filter((item) => !mentionedItems.find((mentioned) => mentioned.id === item.id)),
      ];
    }

    const captureSnapshot = (): TimelineState => JSON.parse(JSON.stringify(latestTimelineRef.current));

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      isUser: true,
      timestamp: new Date(),
      snapshot: captureSnapshot(),
    };
    const nextTabs = tabs.map((t) =>
      t.id === activeTab.id
        ? {
            ...t,
            // intelligent one-time auto-rename if this is the first message
            name:
              (t.messages?.length || 0) === 0
                ? messageContent.length > 24
                  ? messageContent.slice(0, 24) + "…"
                  : messageContent
                : t.name,
            messages: [...(t.messages || []), userMessage],
          }
        : t,
    );
    setTabs(nextTabs);
    onMessagesChange(
      (nextTabs.find((tt) => tt.id === activeTab.id)?.messages || []).map((m) => ({
        id: m.id,
        content: m.content,
        isUser: m.isUser,
        timestamp: m.timestamp,
      })),
    );

    // Build assistant context
    const chatHistoryPayload = (nextTabs.find((tt) => tt.id === activeTab.id)?.messages || []).map((m) => ({
      role: m.isUser ? "user" : "assistant",
      content: m.content,
      timestamp: m.timestamp,
    }));

    try {
      setIsTyping(true);
      // Use the stored mentioned items to get their IDs
      const mentionedScrubberIds = itemsToSend.map((item) => item.id);

      const response = await axios.post(apiUrl("/ai", true), {
        message: messageContent,
        mentioned_scrubber_ids: mentionedScrubberIds,
        timeline_state: timelineState,
        mediabin_items: mediaBinItems,
        chat_history: chatHistoryPayload,
      });

      let functionCallResponse: any;
      try {
        // Be resilient to provider response shapes; avoid hard Zod failure on client
        if (response && typeof response.data === "object" && response.data !== null) {
          const data = response.data as any;
          if (data.function_call || data.assistant_message) {
            functionCallResponse = data;
          } else {
            functionCallResponse = { assistant_message: "I received an invalid response format from AI." } as any;
          }
        } else {
          functionCallResponse = { assistant_message: "I received an invalid response format from AI." } as any;
        }
      } catch {
        functionCallResponse = { assistant_message: "I received an invalid response format from AI." } as any;
      }
      let aiResponseContent = "";

      // Handle the function call (universal v2: {function_name, arguments})
      if (functionCallResponse.function_call) {
        const { function_call } = functionCallResponse;
        const fn = function_call.function_name;
        const args = function_call.arguments || {};

        const toNumber = (val: unknown): number | undefined => {
          if (typeof val === "number") return Number.isFinite(val) ? val : undefined;
          if (typeof val === "string") {
            const n = parseFloat(val);
            return Number.isFinite(n) ? n : undefined;
          }
          return undefined;
        };

        const toSeconds = (val: unknown): number | undefined => {
          if (typeof val === "number") return Number.isFinite(val) ? val : undefined;
          if (typeof val !== "string") return undefined;
          const raw = val.trim().toLowerCase();
          // Try @alwatr/parse-duration (returns ms)
          try {
            const ms = (parseDuration as unknown as (v: unknown) => number)(raw);
            if (typeof ms === "number" && Number.isFinite(ms)) return ms / 1000;
          } catch {}
          // Try hh:mm:ss / mm:ss
          const colon = raw.match(/^\s*(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*$/);
          if (colon) {
            const h = colon[3] ? parseFloat(colon[1]) : 0;
            const m = colon[3] ? parseFloat(colon[2]) : parseFloat(colon[1]);
            const s = colon[3] ? parseFloat(colon[2 + 1]) : parseFloat(colon[2]);
            const total = (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
            return Number.isFinite(total) ? total : undefined;
          }
          // Fallback numeric seconds
          const n = parseFloat(raw);
          return Number.isFinite(n) ? n : undefined;
        };

        const getArg = <T = unknown,>(obj: Record<string, unknown> | undefined, keys: string[]): T | undefined => {
          if (!obj) return undefined;
          for (const key of keys) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              const value = obj[key];
              if (value !== undefined && value !== null) return value as T;
            }
          }
          return undefined;
        };

        try {
          if (fn === "LLMAddScrubberToTimeline") {
            // Find the media item by ID
            const mediaItem = mediaBinItems.find((item) => item.id === (args.scrubber_id as string));

            if (!mediaItem) {
              aiResponseContent = `❌ Error: Media item with ID "${args.scrubber_id}" not found in the media bin.`;
            } else {
              // Execute the function
              llmAddScrubberToTimeline(
                args.scrubber_id as string,
                mediaBinItems,
                args.track_id as string,
                args.drop_left_px as number,
                handleDropOnTrack,
              );

              aiResponseContent = `✅ Successfully added "${mediaItem.name}" to ${args.track_id} at position ${args.drop_left_px}px.`;
            }
          } else if (fn === "LLMMoveScrubber" || fn === "MoveScrubber") {
            const parsed = MoveScrubberArgsSchema.safeParse(args);
            if (!parsed.success) throw new Error("Invalid arguments for MoveScrubber");
            const a = parsed.data;
            const posSec = (a.new_position_seconds ?? a.position_seconds ?? a.start_seconds ?? 0) as number;
            const destTrack = Number(a.new_track_number ?? a.track_number ?? 1);
            llmMoveScrubber(
              a.scrubber_id,
              posSec,
              destTrack,
              (a.pixels_per_second as number | undefined) ?? pixelsPerSecond,
              timelineState,
              handleUpdateScrubber,
            );

            // Try to locate the scrubber name for a nicer message
            const allScrubbers = timelineState.tracks.flatMap((t) => t.scrubbers);
            const moved = allScrubbers.find((s) => s.id === (args.scrubber_id as string));
            const movedName = moved ? moved.name : (args.scrubber_id as string);
            aiResponseContent = `✅ Moved "${movedName}" to track ${args.new_track_number} at ${args.new_position_seconds}s.`;
          } else if (fn === "LLMAddScrubberByName" || fn === "AddMediaByName") {
            const parsed = AddScrubberByNameArgsSchema.safeParse(args);
            if (!parsed.success) throw new Error("Invalid arguments for AddScrubberByName");
            const a = parsed.data;
            const name = a.scrubber_name;
            const pps = (a.pixels_per_second as number | undefined) ?? pixelsPerSecond;
            const startSeconds = (a.start_seconds ?? a.position_seconds ?? 0) as number;
            const trackNumber = Number(a.track_number ?? 1);
            const startPx = startSeconds * pps;

            const newId = llmAddScrubberByName(
              name,
              mediaBinItems,
              trackNumber,
              startSeconds,
              pps,
              handleDropOnTrack,
            ) as unknown as string;

            // Optional duration or end time handling (resize after drop)
            const endSec = a.end_seconds as number | undefined;
            const durationSeconds =
              (a.duration_seconds as number | undefined) ??
              (endSec !== undefined ? Math.max(0, endSec - startSeconds) : undefined);
            if (durationSeconds && durationSeconds > 0) {
              if (newId) {
                setPendingResizeRequests((prev) => [
                  ...prev,
                  { id: newId as string, durationSeconds, pixelsPerSecond: pps, trackNumber },
                ]);
              }
            }

            aiResponseContent = `✅ Added "${name}" to track ${trackNumber} at ${startSeconds}s.`;
          } else if (fn === "AddMediaById") {
            const parsed = AddMediaByIdArgsSchema.safeParse(args);
            if (!parsed.success) throw new Error("Invalid arguments for AddMediaById");
            const a = parsed.data;
            const scrubberId = a.scrubber_id;
            const pps = (a.pixels_per_second as number | undefined) ?? pixelsPerSecond;
            const startSeconds = (a.start_seconds as number | undefined) ?? 0;
            const trackNumber = Number(a.track_number ?? 1);
            const startPx = startSeconds * pps;

            const mediaItem = mediaBinItems.find((i) => i.id === scrubberId);
            if (!mediaItem) {
              aiResponseContent = `❌ Error: Media item with ID "${scrubberId}" not found in the media bin.`;
            } else {
              const trackId = `track-${trackNumber}`;
              const newId = handleDropOnTrack(mediaItem, trackId, startPx);

              const endSec2 = a.end_seconds as number | undefined;
              const durationSeconds =
                (a.duration_seconds as number | undefined) ??
                (endSec2 !== undefined ? Math.max(0, endSec2 - startSeconds) : undefined);
              if (durationSeconds && durationSeconds > 0) {
                if (newId) {
                  setPendingResizeRequests((prev) => [
                    ...prev,
                    { id: newId, durationSeconds, pixelsPerSecond: pps, trackNumber },
                  ]);
                }
              }

              aiResponseContent = `✅ Added media to track ${trackNumber} at ${startSeconds}s.`;
            }
          } else if (fn === "LLMDeleteScrubbersInTrack" || fn === "DeleteScrubbersInTrack") {
            if (!handleDeleteScrubber) {
              throw new Error("Delete handler is not available");
            }
            const parsed = DeleteScrubbersInTrackArgsSchema.safeParse(args);
            const trackNum = parsed.success ? Number(parsed.data.track_number ?? 1) : 1;
            llmDeleteScrubbersInTrack(trackNum, timelineState, handleDeleteScrubber);
            aiResponseContent = `✅ Removed all scrubbers in track ${trackNum}.`;
          } else if (fn === "LLMResizeScrubber" || fn === "ResizeScrubber") {
            const parsed = ResizeScrubberArgsSchema.safeParse(args);
            if (!parsed.success) throw new Error("Invalid arguments for ResizeScrubber");
            const a = parsed.data as any;
            const startSecForDiff = (a.start_seconds ?? a.position_seconds) as number | undefined;
            const candidateDur = (a.new_duration_seconds ??
              a.duration_seconds ??
              a.seconds ??
              a.duration ??
              a.newDurationSeconds ??
              a.durationInSeconds) as number | undefined;
            const endSecVal = a.end_seconds as number | undefined;
            const dur =
              candidateDur ??
              (startSecForDiff !== undefined && endSecVal !== undefined
                ? Math.max(0, endSecVal - startSecForDiff)
                : undefined);
            const ppsVal = (a.pixels_per_second as number | undefined) ?? pixelsPerSecond;
            const trackNum = (a.track_number as number | undefined) ?? (a.new_track_number as number | undefined);
            let targetId = typeof a.scrubber_id === "string" ? (a.scrubber_id as string) : undefined;
            if (!targetId && trackNum !== undefined) {
              const trackIndex = Math.max(0, Math.floor(trackNum) - 1);
              const track = timelineState.tracks?.[trackIndex];
              if (track && track.scrubbers.length > 0) {
                const nameRaw = a.scrubber_name as string | undefined;
                const nameSub = typeof nameRaw === "string" ? nameRaw.toLowerCase() : undefined;
                if (nameSub) {
                  const found = track.scrubbers.find((s) => s.name.toLowerCase().includes(nameSub));
                  if (found) targetId = found.id;
                }
                if (!targetId) {
                  // fallback to rightmost scrubber
                  targetId = track.scrubbers.reduce(
                    (best, s) => (s.left > best.left ? s : best),
                    track.scrubbers[0],
                  ).id;
                }
              }
            }
            if (dur && dur > 0 && targetId) {
              llmResizeScrubber(targetId, dur, ppsVal, timelineState, handleUpdateScrubber);
              aiResponseContent = `✅ Resized scrubber to ${dur}s.`;
            } else if (!targetId) {
              aiResponseContent = `❌ Unable to resize: could not identify target scrubber.`;
            } else {
              aiResponseContent = `❌ Unable to resize: invalid duration.`;
            }
          } else if (fn === "LLMUpdateTextContent" || fn === "UpdateTextContent") {
            const parsed = UpdateTextContentArgsSchema.safeParse(args);
            if (!parsed.success) throw new Error("Invalid arguments for UpdateTextContent");
            llmUpdateTextContent(
              parsed.data.scrubber_id,
              parsed.data.new_text_content,
              timelineState,
              handleUpdateScrubber,
            );
            aiResponseContent = `✅ Updated text content.`;
          } else if (fn === "LLMUpdateTextStyle" || fn === "UpdateTextStyle") {
            const parsed = UpdateTextStyleArgsSchema.safeParse(args);
            if (!parsed.success) throw new Error("Invalid arguments for UpdateTextStyle");
            const { scrubber_id, ...style } = parsed.data as any;
            llmUpdateTextStyle(scrubber_id, style, timelineState, handleUpdateScrubber);
            aiResponseContent = `✅ Updated text style.`;
          } else if (fn === "LLMMoveScrubbersByOffset" || fn === "MoveScrubbersByOffset") {
            const parsed = MoveScrubbersByOffsetArgsSchema.safeParse(args);
            if (!parsed.success) throw new Error("Invalid arguments for MoveScrubbersByOffset");
            llmMoveScrubbersByOffset(
              parsed.data.scrubber_ids,
              parsed.data.offset_seconds as number,
              (parsed.data.pixels_per_second as number | undefined) ?? pixelsPerSecond,
              timelineState,
              handleUpdateScrubber,
            );
            aiResponseContent = `✅ Moved ${parsed.data.scrubber_ids.length} scrubber(s) by ${parsed.data.offset_seconds}s.`;
          } else if (fn === "CreateTrack") {
            if (handleAddTrack) {
              handleAddTrack();
              aiResponseContent = "✅ Created 1 new track.";
            } else {
              aiResponseContent = "❌ Cannot create track: handler unavailable.";
            }
          } else if (fn === "CreateTracks") {
            const count = toNumber((args as any).count) ?? 1;
            if (handleAddTrack) {
              const n = Math.max(1, Math.floor(count));
              for (let i = 0; i < n; i++) handleAddTrack();
              aiResponseContent = `✅ Created ${n} track(s).`;
            } else {
              aiResponseContent = "❌ Cannot create tracks: handler unavailable.";
            }
          } else if (fn === "PlaceAllAssetsParallel") {
            // Place each media bin item on a separate (new if needed) track at the same start time
            const startSec = toSeconds((args as any).start_seconds) ?? 0;
            const pps = toNumber((args as any).pixels_per_second) ?? pixelsPerSecond;
            const startPx = startSec * pps;
            const requiredTracks = mediaBinItems.length;
            // Ensure enough tracks
            const shortage = Math.max(0, requiredTracks - timelineState.tracks.length);
            if (shortage > 0 && handleAddTrack) {
              for (let i = 0; i < shortage; i++) handleAddTrack();
            }
            mediaBinItems.forEach((item, index) => {
              const trackId = timelineState.tracks[index]?.id || `track-${index + 1}`;
              handleDropOnTrack(item, trackId, startPx);
            });
            aiResponseContent = `✅ Placed ${mediaBinItems.length} asset(s) in parallel across tracks at ${startSec}s.`;
          } else if (fn === "LLMSetResolution" || fn === "SetResolution") {
            // This requires handlers from parent; ChatBox doesn't own them, so we ignore here or bubble up later.
            // Leaving placeholder for future wiring if exposed via props.
            aiResponseContent = `ℹ️ Resolution change acknowledged.`;
          } else {
            aiResponseContent = `❌ Unknown function: ${fn}`;
          }
        } catch (error) {
          aiResponseContent = `❌ Error executing function: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
        }
      } else if (functionCallResponse.assistant_message) {
        aiResponseContent = functionCallResponse.assistant_message;
      } else {
        aiResponseContent =
          "I understand your request, but I couldn't determine a specific action to take. Could you please be more specific?";
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseContent,
        isUser: false,
        timestamp: new Date(),
        snapshot: captureSnapshot(),
      };
      const updated = tabs.map((t) =>
        t.id === activeTab.id
          ? { ...t, messages: [...t.messages, userMessage, aiMessage], timelineSnapshot: latestTimelineRef.current }
          : t,
      );
      setTabs(updated);
      onMessagesChange([...messages, userMessage, aiMessage]);
    } catch (error) {
      console.error("Error calling AI API:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `❌ Sorry, I encountered an error while processing your request. Please try again.`,
        isUser: false,
        timestamp: new Date(),
        snapshot: captureSnapshot(),
      };

      const updated = tabs.map((t) =>
        t.id === activeTab.id
          ? { ...t, messages: [...t.messages, userMessage, errorMessage], timelineSnapshot: latestTimelineRef.current }
          : t,
      );
      setTabs(updated);
      onMessagesChange([...messages, userMessage, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (showMentions && filteredMentions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev < filteredMentions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : filteredMentions.length - 1));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        insertMention(filteredMentions[selectedMentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }

    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Allow default behavior for Shift+Enter (new line)
        return;
      } else {
        // Send message on Enter
        e.preventDefault();
        handleSendMessage(sendWithMedia);
      }
    }
  };

  // helpers to update current tab messages consistently
  const setActiveTabMessages = (newMessages: Message[]) => {
    const updatedTabs = tabs.map((t) =>
      t.id === activeTab.id ? { ...t, messages: newMessages, timelineSnapshot: latestTimelineRef.current } : t,
    );
    setTabs(updatedTabs);
    onMessagesChange(newMessages);
  };

  const truncateAtIndexPreserveReply = (index: number) => {
    const base = activeTab?.messages || messages;
    if (index < 0 || index >= base.length) return;
    const keepUntil = base[index + 1] && !base[index + 1].isUser ? index + 1 : index;
    setActiveTabMessages(base.slice(0, keepUntil + 1));
  };

  const restoreAtIndex = (index: number) => {
    const base = activeTab?.messages || messages;
    if (index < 0 || index >= base.length) return;
    const msg = base[index];
    const snap = msg?.snapshot || null;
    if (snap && restoreTimeline) restoreTimeline(snap);
    truncateAtIndexPreserveReply(index);
  };

  const startInlineEditAt = (index: number) => {
    const base = activeTab?.messages || messages;
    const msg = base[index];
    if (!msg) return;
    // auto-restore to saved snapshot and truncate
    restoreSnapshot?.();
    truncateAtIndexPreserveReply(index);
    setInputValue(msg.content);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const formatTime = (dateLike: unknown) => {
    try {
      const d = dateLike instanceof Date ? dateLike : new Date(dateLike as any);
      if (!(d instanceof Date) || isNaN(d.getTime())) return "";
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  // Tab actions
  const createTab = () => {
    const t: ChatTab = {
      id: Date.now().toString(),
      name: `Chat ${tabs.length + 1}`,
      messages: [],
      timelineSnapshot: null,
      createdAt: Date.now(),
    };
    const next = [...tabs, t];
    setTabs(next);
    setActiveTabId(t.id);
  };
  const renameTab = (id: string) => {
    const name = prompt("Rename chat", tabs.find((x) => x.id === id)?.name || "Chat");
    if (!name) return;
    setTabs(tabs.map((t) => (t.id === id ? { ...t, name } : t)));
  };
  const deleteTab = (id: string) => {
    const next = tabs.filter((t) => t.id !== id);
    setTabs(
      next.length
        ? next
        : [{ id: Date.now().toString(), name: "Chat 1", messages: [], timelineSnapshot: null, createdAt: Date.now() }],
    );
    if (activeTabId === id) setActiveTabId((next[0] || { id: "" }).id);
  };
  const saveSnapshot = () => {
    setTabs(tabs.map((t) => (t.id === activeTab.id ? { ...t, timelineSnapshot: latestTimelineRef.current } : t)));
  };
  const restoreSnapshot = () => {
    const snap = activeTab.timelineSnapshot;
    if (!snap || !restoreTimeline) return;
    restoreTimeline(snap);
  };

  // Send to new chat helper
  const [sendToTabId, setSendToTabId] = useState<string | null>(null);
  const sendMessageToNewChat = (includeAllMedia = false) => {
    const newTab: ChatTab = {
      id: Date.now().toString(),
      name: `Chat ${tabs.length + 1}`,
      messages: [],
      timelineSnapshot: null,
      createdAt: Date.now(),
    };
    const next = [...tabs, newTab];
    setTabs(next);
    setActiveTabId(newTab.id);
    setSendToTabId(newTab.id);
    // Slight delay to allow state to settle before sending
    setTimeout(() => handleSendMessage(includeAllMedia), 0);
  };

  return (
    <div className={`relative h-full flex flex-col bg-background ${className}`}>
      {/* Chat Header */}
      <div className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col px-3 py-1 shrink-0">
        {/* Row 1: brand + actions */}
        <div ref={headerRef} className="h-7 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium tracking-tight">Ask Kimu</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={createTab} title="New chat">
              +
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="History"
              onClick={() => setIsHistoryOpen((v) => !v)}>
              <History className="h-3 w-3" />
            </Button>
            {onToggleMinimize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMinimize}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                title={isMinimized ? "Expand chat" : "Minimize chat"}>
                {isMinimized ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </Button>
            )}
          </div>
        </div>
        {/* Row 2: tabs strip (single-line, horizontally scrollable) */}
        <div className="mt-1 flex items-center gap-1">
          <div
            ref={tabsContainerRef}
            className="flex-1 flex items-center gap-2 overflow-x-auto whitespace-nowrap chat-tabs-scroll tabs-fade-edges no-scrollbar">
            {tabs.map((t) => (
              <button
                key={t.id}
                data-tab-id={t.id}
                className={`text-[12px] flex-shrink-0 transition-colors rounded-md px-2 py-1 border ${
                  t.id === activeTabId
                    ? "bg-muted/40 text-foreground border-border"
                    : "bg-transparent text-muted-foreground border-transparent hover:bg-muted/30 hover:text-foreground"
                }`}
                onClick={() => {
                  setActiveTabId(t.id);
                  scrollToTabId(t.id);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setTabsMenu({ open: true, x: e.clientX, y: e.clientY, tabId: t.id });
                }}
                title={new Date(t.createdAt).toLocaleString()}>
                {editingTabId === t.id ? (
                  <input
                    autoFocus
                    value={editingTabName}
                    onChange={(e) => setEditingTabName(e.target.value)}
                    onBlur={() => {
                      const name = editingTabName.trim();
                      if (name) setTabs(tabs.map((x) => (x.id === t.id ? { ...x, name } : x)));
                      setEditingTabId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
                      if (e.key === "Escape") setEditingTabId(null);
                    }}
                    className="bg-transparent border-b border-border focus:outline-none text-[12px] px-1"
                  />
                ) : (
                  t.name
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History panel centered (no blur overlay) */}
      {isHistoryOpen && (
        <>
          {/* slight dark/blur overlay only over the chat panel */}
          <div
            className="absolute left-0 right-0 top-8 bottom-0 bg-black/20 backdrop-blur-[1px] z-40"
            onClick={() => setIsHistoryOpen(false)}
          />
          <div
            className="absolute z-50 top-12 left-1/2 -translate-x-1/2 rounded-lg border bg-background shadow-lg text-[11px]"
            style={{ width: historyWidthPx ? Math.min(Math.max(historyWidthPx - 16, 280), 560) : 420 }}>
            <div className="border-b">
              <input
                className="w-full h-8 px-3 rounded-none bg-muted/40 border-0 text-[11px]"
                placeholder="Search..."
                value={historyQuery}
                onChange={(e) => setHistoryQuery(e.target.value)}
              />
            </div>
            <div className="max-h-72 overflow-y-auto p-1">
              {(() => {
                const filtered = tabs
                  .map((t) => ({
                    ...t,
                    lastActivity: (t.messages?.[t.messages.length - 1]?.timestamp as any)?.getTime?.() || t.createdAt,
                  }))
                  .filter((t) => t.name.toLowerCase().includes(historyQuery.toLowerCase()))
                  .sort((a, b) => b.lastActivity - a.lastActivity);

                const groups: Record<string, typeof filtered> = {} as any;
                filtered.forEach((t) => {
                  const g = getRecencyGroup(t.lastActivity);
                  if (!groups[g]) groups[g] = [] as any;
                  groups[g].push(t);
                });

                const order = ["Last hour", "Today", "Yesterday", "This week", "Older"];
                return order
                  .filter((g) => groups[g] && groups[g].length)
                  .map((g) => (
                    <div key={g} className="py-1">
                      <div className="px-3 py-1 text-[9px] uppercase tracking-wide text-muted-foreground">{g}</div>
                      {groups[g].map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between px-3 py-1 hover:bg-muted/40 cursor-pointer"
                          onClick={() => {
                            setActiveTabId(t.id);
                            setIsHistoryOpen(false);
                            scrollToTabId(t.id);
                          }}>
                          <span className="flex-1 truncate">
                            {historyEditingId === t.id ? (
                              <input
                                autoFocus
                                className="w-full h-7 px-2 rounded border border-border/60 bg-background text-[11px]"
                                value={historyEditingName}
                                onChange={(e) => setHistoryEditingName(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onBlur={() => {
                                  const name = historyEditingName.trim();
                                  if (name) setTabs(tabs.map((x) => (x.id === t.id ? { ...x, name } : x)));
                                  setHistoryEditingId(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
                                  if (e.key === "Escape") setHistoryEditingId(null);
                                }}
                              />
                            ) : (
                              t.name
                            )}
                          </span>
                          <div className="flex items-center">
                            <button
                              className="p-1 text-muted-foreground hover:text-primary rounded transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setHistoryEditingId(t.id);
                                setHistoryEditingName(t.name);
                              }}
                              title="Rename chat">
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              className="ml-1 p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTab(t.id);
                              }}
                              title="Delete chat">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ));
              })()}
            </div>
          </div>
        </>
      )}

      {/* Content Area */}
      <div className="flex-1 flex flex-col">
        {messages.length === 0 ? (
          // Default clean state - Copilot style
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Ask Kimu</h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
              Kimu is your AI assistant for video editing. Ask questions, get help with timeline operations, or request
              specific edits.
            </p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <AtSign className="h-3 w-3" />
                <span>to chat with media</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Enter</kbd>
                <span>to send</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Shift</kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Enter</kbd>
                <span>for new line</span>
              </div>
            </div>
          </div>
        ) : (
          // Messages Area
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-3 scroll-smooth"
            style={{ maxHeight: "calc(100vh - 200px)" }}>
            <div className="space-y-3">
              {(activeTab?.messages || messages).map((message, idx) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ open: true, x: e.clientX, y: e.clientY, index: idx, message });
                  }}>
                  {message.isUser ? (
                    <div className="w-full rounded-xl px-3 py-2 text-xs border bg-muted/30">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="leading-relaxed break-words overflow-wrap-anywhere">{message.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] opacity-70 hidden">{formatTime(message.timestamp)}</span>
                            <button
                              className="ml-auto text-muted-foreground hover:text-primary transition-colors"
                              title="Restore to this point"
                              onClick={() => restoreAtIndex(idx)}>
                              <CornerUpLeft className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full text-xs px-3 py-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="leading-relaxed break-words overflow-wrap-anywhere">{message.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] opacity-70">{formatTime(message.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg px-3 py-2 text-xs bg-transparent mr-8">
                    <div className="flex items-center gap-2">
                      <Bot className="h-3 w-3 text-muted-foreground shrink-0" />
                      <div className="flex space-x-1">
                        <div
                          className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <div
                          className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <div
                          className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} />
              {/* Simple custom context menu */}
              {contextMenu.open && (
                <div
                  className="fixed z-50 bg-background border border-border/60 rounded-md shadow-lg text-xs"
                  style={{ top: contextMenu.y + 4, left: contextMenu.x + 4 }}
                  onMouseLeave={() => setContextMenu({ ...contextMenu, open: false })}>
                  <div
                    className="px-3 py-2 hover:bg-muted cursor-pointer flex items-center gap-2"
                    onClick={() => {
                      setContextMenu({ ...contextMenu, open: false });
                      startInlineEditAt(contextMenu.index);
                    }}>
                    <Pencil className="h-3 w-3" /> Edit here (inline)
                  </div>
                  <div
                    className="px-3 py-2 hover:bg-muted cursor-pointer flex items-center gap-2"
                    onClick={() => {
                      setContextMenu({ ...contextMenu, open: false });
                      setConfirmRestoreIndex(contextMenu.index);
                      setShowConfirmRestore(true);
                    }}>
                    <RotateCcw className="h-3 w-3" /> Restore to this point
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input Area with enhanced overlap effect */}
      <div className="relative bg-gradient-to-t from-background to-background/50 p-3 border-t border-border/30 backdrop-blur-sm -mt-2 pt-4">
        {/* Mentions Dropdown */}
        {showMentions && filteredMentions.length > 0 && (
          <div
            ref={mentionsRef}
            className="absolute bottom-full left-4 right-4 mb-2 bg-background border border-border/50 rounded-lg shadow-lg max-h-40 overflow-y-auto z-50">
            {filteredMentions.map((item, index) => (
              <div
                key={item.id}
                className={`px-3 py-2 text-xs cursor-pointer flex items-center gap-2 ${
                  index === selectedMentionIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                }`}
                onClick={() => insertMention(item)}>
                <div className="w-6 h-6 bg-muted/50 rounded flex items-center justify-center">
                  {item.mediaType === "video" ? (
                    <FileVideo className="h-3 w-3 text-muted-foreground" />
                  ) : item.mediaType === "image" ? (
                    <FileImage className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Type className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <span className="flex-1 truncate">{item.name}</span>
                <span className="text-xs text-muted-foreground">{item.mediaType}</span>
              </div>
            ))}
          </div>
        )}

        {/* Send Options Dropdown */}
        {showSendOptions && (
          <div
            ref={sendOptionsRef}
            className="absolute bottom-full right-4 mb-2 bg-background border border-border/50 rounded-md shadow-lg z-50 min-w-48">
            <div className="p-1">
              <div
                className="px-3 py-2 text-xs cursor-pointer hover:bg-muted rounded flex items-center justify-between"
                onClick={() => {
                  setSendWithMedia(false);
                  setShowSendOptions(false);
                  handleSendMessage(false);
                }}>
                <span>Send</span>
                <span className="text-xs text-muted-foreground font-mono">Enter</span>
              </div>
              <div
                className="px-3 py-2 text-xs cursor-pointer hover:bg-muted rounded flex items-center justify-between"
                onClick={() => {
                  setSendWithMedia(true);
                  setShowSendOptions(false);
                  handleSendMessage(true);
                }}>
                <span>Send with all Media</span>
              </div>
              <div
                className="px-3 py-2 text-xs cursor-pointer hover:bg-muted rounded flex items-center justify-between"
                onClick={() => {
                  // Clear current messages and send to new chat
                  setShowSendOptions(false);
                  sendMessageToNewChat(false);
                }}>
                <span>Send to New Chat</span>
              </div>
            </div>
          </div>
        )}

        {/* Input container with subtle shadow and better styling */}
        <div className="relative border border-border/60 rounded-lg bg-background/90 backdrop-blur-sm focus-within: focus-within:border-ring transition-all duration-200 shadow-sm">
          {/* Full-width textarea */}
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Ask Kimu..."
            className={cn(
              "w-full min-h-8 max-h-20 resize-none text-xs bg-transparent border-0 px-3 pt-2.5 pb-1 placeholder:text-muted-foreground/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              "transition-all duration-200 leading-relaxed",
            )}
            disabled={isTyping}
            rows={1}
            style={{ height: `${Math.max(textareaHeight, 32)}px` }}
          />

          {/* Buttons row below text with refined styling */}
          <div className="flex items-center justify-between px-2.5 pb-2 pt-0">
            {/* @ Button - left side, smaller */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
              onClick={() => {
                if (inputRef.current) {
                  const cursorPos = inputRef.current.selectionStart || inputValue.length;
                  const newValue = inputValue.slice(0, cursorPos) + "@" + inputValue.slice(cursorPos);
                  setInputValue(newValue);
                  const newCursorPos = cursorPos + 1;
                  setCursorPosition(newCursorPos);

                  // Trigger mentions dropdown immediately
                  setMentionQuery("");
                  setShowMentions(true);
                  setSelectedMentionIndex(0);

                  setTimeout(() => {
                    inputRef.current?.focus();
                    inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
                  }, 0);
                }
              }}>
              <AtSign className="h-2.5 w-2.5" />
            </Button>

            {/* Send buttons - right side, smaller and refined */}
            <div className="flex items-center gap-0.5">
              <Button
                onClick={() => handleSendMessage(sendWithMedia)}
                disabled={!inputValue.trim() || isTyping}
                size="sm"
                className="h-6 px-2 bg-transparent hover:bg-primary/10 text-primary hover:text-primary text-xs"
                variant="ghost">
                <Send className="h-2.5 w-2.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
                disabled={isTyping}
                onClick={() => setShowSendOptions(!showSendOptions)}>
                <ChevronDown className="h-2.5 w-2.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Modals for restore/delete/edit */}
      <AlertDialog open={showConfirmRestore} onOpenChange={setShowConfirmRestore}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore to this point?</AlertDialogTitle>
            <AlertDialogDescription>
              The timeline will be restored to the snapshot saved for this chat. Messages after this point can be
              deleted optionally.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirmRestore(false);
                if (confirmRestoreIndex !== null) restoreAtIndex(confirmRestoreIndex);
              }}>
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tabs context menu: Rename / Clear / Delete */}
      {tabsMenu.open && (
        <div
          className="fixed z-50 bg-background border border-border/60 rounded-md shadow-lg text-xs"
          style={{ top: tabsMenu.y + 4, left: tabsMenu.x + 4 }}
          onMouseLeave={() => setTabsMenu({ ...tabsMenu, open: false })}>
          <div
            className="px-3 py-2 hover:bg-muted cursor-pointer flex items-center gap-2"
            onClick={() => {
              setTabsMenu({ ...tabsMenu, open: false });
              if (!tabsMenu.tabId) return;
              const t = tabs.find((x) => x.id === tabsMenu.tabId);
              if (!t) return;
              setEditingTabId(t.id);
              setEditingTabName(t.name);
            }}>
            <Pencil className="h-3 w-3" /> Rename chat
          </div>
          <div
            className="px-3 py-2 hover:bg-muted cursor-pointer flex items-center gap-2"
            onClick={() => {
              setTabsMenu({ ...tabsMenu, open: false });
              if (!tabsMenu.tabId) return;
              if (tabsMenu.tabId === activeTab.id) {
                setActiveTabMessages([]);
              } else {
                setTabs(tabs.map((t) => (t.id === tabsMenu.tabId ? { ...t, messages: [] } : t)));
              }
            }}>
            <Eraser className="h-3 w-3" /> Clear chat
          </div>
          <div
            className="px-3 py-2 text-destructive cursor-pointer flex items-center gap-2 hover:bg-destructive/10"
            onClick={() => {
              setTabsMenu({ ...tabsMenu, open: false });
              if (!tabsMenu.tabId) return;
              deleteTab(tabsMenu.tabId);
            }}>
            <Trash2 className="h-3 w-3" /> Delete chat
          </div>
        </div>
      )}
    </div>
  );
}
