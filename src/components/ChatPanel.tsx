/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/ChatPanel.tsx
import type React from "react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  MutableRefObject,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Upload,
  Send,
  X,
  Loader2,
  MapPin,
  TrendingUp,
  Droplets,
  FileText,
  Sun,
  Moon,
  Plus,
  MessageSquare,
  Search,
  ChevronRight,
  History,
  ChevronDown,
} from "lucide-react";

type OptionSet = {
  preProcessing: boolean;
  atmosphericCorrections: boolean;
  cloudMasking: boolean;
  filters: boolean;
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  images?: string[];
  timestamp: Date;
}

interface ChatHistoryItem {
  id: string;
  title: string;
  messages: Message[];
}

interface UploadedImage {
  id: string;
  src: string;
  dropdownOpen?: boolean;
  options: OptionSet;
}

const createInitialMessages = (): Message[] => [
  {
    id: "assistant-welcome",
    role: "assistant",
    content:
      "Welcome to the EO Chat Assistant. Upload satellite images and ask questions about land cover, vegetation health, water resources, or change detection. I'm here to help analyze your Earth Observation data.",
    timestamp: new Date(),
  },
];

/**
 * DropdownPortal - renders a panel into document.body positioned relative to
 * a provided anchor element (anchorRef). This prevents clipping by overflow: hidden
 * containers.
 */
function DropdownPortal({
  anchorRef,
  open,
  onClose,
  children,
  offset = { x: 0, y: 8 },
}: {
  anchorRef: MutableRefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  offset?: { x: number; y: number };
}) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const [, setTick] = useState(0);

  useLayoutEffect(() => {
    if (!elRef.current) {
      elRef.current = document.createElement("div");
      elRef.current.style.position = "absolute";
      elRef.current.style.top = "0";
      elRef.current.style.left = "0";
      elRef.current.style.zIndex = "9999";
      document.body.appendChild(elRef.current);
    }
    return () => {
      if (elRef.current && elRef.current.parentElement) {
        elRef.current.parentElement.removeChild(elRef.current);
      }
      elRef.current = null;
    };
  }, []);

  // update position on open, scroll, resize
  useEffect(() => {
    if (!open || !anchorRef.current || !elRef.current) return;

    const updatePos = () => {
      const anchor = anchorRef.current!;
      const rect = anchor.getBoundingClientRect();
      let left = Math.round(rect.left + offset.x);
      let top = Math.round(rect.bottom + offset.y);

      // If panel would overflow right edge, shift left
      const panelWidth = elRef.current!.offsetWidth || 240;
      const viewportW = window.innerWidth;
      if (left + panelWidth + 8 > viewportW) {
        left = Math.max(8, viewportW - panelWidth - 8);
      }

      // If panel would overflow bottom edge, position above anchor
      const panelHeight = elRef.current!.offsetHeight || 200;
      const viewportH = window.innerHeight;
      if (top + panelHeight + 8 > viewportH) {
        // position above anchor
        top = Math.round(rect.top - panelHeight - offset.y);
        if (top < 8) top = 8;
      }

      elRef.current!.style.transform = `translate(${left}px, ${top}px)`;
      setTick((t) => t + 1);
    };

    updatePos();
    const ro = new ResizeObserver(updatePos);
    ro.observe(anchorRef.current);
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open, anchorRef, offset.x, offset.y]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const anchor = anchorRef.current;
      const el = elRef.current;
      if (!anchor || !el) return;
      const target = e.target as Node | null;
      if (target && (anchor.contains(target) || el.contains(target))) return;
      onClose();
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open, onClose, anchorRef]);

  if (!elRef.current) return null;
  return createPortal(<div>{open ? children : null}</div>, elRef.current);
}

const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(createInitialMessages);
  const [input, setInput] = useState("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return document.documentElement.classList.contains("dark");
  });

  const [isImageHistoryOpen, setIsImageHistoryOpen] = useState(false);

  // --- New: feedback dialog state & fields ---
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackImage, setFeedbackImage] = useState<string | null>(null);
  const [feedbackGptSummary, setFeedbackGptSummary] = useState("");
  const [feedbackUserSummary, setFeedbackUserSummary] = useState("");

  const navigate = useNavigate();

  // refs to anchors (thumbnail option buttons) for portal positioning
  const anchorRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const quickActions = [
    { label: "Land-cover summary", icon: MapPin },
    { label: "Change detection", icon: TrendingUp },
    { label: "Vegetation health", icon: TrendingUp },
    { label: "Water-body analysis", icon: Droplets },
    { label: "Generate report", icon: FileText },
  ];

  const imageHistory: string[] = messages.flatMap((m) => {
    if (m.images && m.images.length > 0) return m.images;
    if (m.image) return [m.image];
    return [];
  });

  const handleSend = () => {
    if (!input.trim() && uploadedImages.length === 0) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      images: uploadedImages.length
        ? uploadedImages.map((u) => u.src)
        : undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setUploadedImages([]);
    setIsAnalyzing(true);

    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Based on the EO image analysis:\n\n• Forest cover: 45.2% (↓ 3.1% from baseline)\n• Built-up area: 22.8% (↑ 5.4%)\n• Water bodies: 8.5% (↓ 1.2%)\n• Agricultural land: 18.3%\n• Barren land: 5.2%\n\nKey observations: Significant deforestation detected in the northwestern region. Urban expansion is concentrated along the eastern corridor. Water stress indicators present in major reservoirs.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, response]);
      setIsAnalyzing(false);
    }, 1600);
  };

  const handleQuickAction = (label: string) => {
    setInput(label);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const readers = files.map(
      (file) =>
        new Promise<UploadedImage>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            resolve({
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              src: reader.result as string,
              dropdownOpen: false,
              options: {
                preProcessing: false,
                atmosphericCorrections: false,
                cloudMasking: false,
                filters: false,
              },
            });
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers).then((imgs) => {
      setUploadedImages((prev) => [...prev, ...imgs]);
    });

    e.currentTarget.value = "";
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleImageDropdown = (index: number) => {
    setUploadedImages((prev) =>
      prev.map((img, i) =>
        i === index
          ? { ...img, dropdownOpen: !img.dropdownOpen }
          : { ...img, dropdownOpen: false }
      )
    );
  };

  const updateImageOption = (index: number, newPartial: Partial<OptionSet>) => {
    setUploadedImages((prev) =>
      prev.map((img, i) =>
        i === index
          ? { ...img, options: { ...img.options, ...newPartial } }
          : img
      )
    );
  };

  const applyOptionsToAll = (sourceIndex: number) => {
    const src = uploadedImages[sourceIndex];
    if (!src) return;
    setUploadedImages((prev) =>
      prev.map((img) => ({ ...img, options: { ...src.options } }))
    );
  };

  const handleNewProject = () => {
    const hasUserMessages = messages.some((m) => m.role === "user");

    if (hasUserMessages) {
      const firstUser = messages.find((m) => m.role === "user");
      const rawTitle =
        firstUser?.content.trim() || `Chat ${history.length + 1}`;
      const title =
        rawTitle.length > 40 ? rawTitle.slice(0, 40).trim() + "..." : rawTitle;

      const newHistoryItem: ChatHistoryItem = {
        id:
          typeof crypto !== "undefined" && (crypto as any).randomUUID
            ? (crypto as any).randomUUID()
            : Date.now().toString() + "-chat",
        title,
        messages,
      };

      setHistory((prev) => [newHistoryItem, ...prev]);
    }

    setMessages(createInitialMessages());
    setActiveChatId(null);
  };

  const handleSelectHistoryChat = (chat: ChatHistoryItem) => {
    setMessages(chat.messages);
    setActiveChatId(chat.id);
  };

  const filteredHistory =
    appliedSearch.trim().length === 0
      ? history
      : history.filter((chat) =>
          chat.title.toLowerCase().includes(appliedSearch.toLowerCase())
        );

  const handleSearchClick = () => {
    setAppliedSearch(searchTerm.trim());
  };

  const handlePersonalization = () => {
    console.log("Personalization clicked");
  };

  const handleSettings = () => {
    console.log("Settings clicked");
  };

  const handleHelp = () => {
    console.log("Help clicked");
  };

  const handleLogout = () => {
    setMessages(createInitialMessages());
    setHistory([]);
    setActiveChatId(null);
    setInput("");
    setUploadedImages([]);
    setIsAnalyzing(false);

    navigate("/");
  };

  // --- Feedback handlers ---
  const onFeedbackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setFeedbackImage(reader.result as string);
    reader.readAsDataURL(f);
  };

  const submitFeedback = () => {
    // For now just log — replace with API call if needed
    console.log("Feedback submitted:", {
      feedbackImage,
      feedbackGptSummary,
      feedbackUserSummary,
    });
    // reset & close
    setFeedbackImage(null);
    setFeedbackGptSummary("");
    setFeedbackUserSummary("");
    setIsFeedbackOpen(false);
  };

  return (
    <div className="flex w-full h-[calc(100vh-120px)] bg-background text-foreground overflow-hidden">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 border-r bg-background/95 flex flex-col">
        <div className="px-3 pt-3 pb-2 border-b">
          <Button
            className="w-full justify-start gap-2"
            variant="outline"
            onClick={handleNewProject}
          >
            <Plus className="h-4 w-4" />
            New project
          </Button>
        </div>

        <div className="px-3 pt-2 pb-3 border-b">
          <div className="flex gap-2">
            <Input
              placeholder="Search chats"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-xs"
            />
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={handleSearchClick}
              aria-label="Search chat history"
            >
              <Search className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 px-2 py-2">
          {filteredHistory.length > 0 ? (
            <div className="space-y-1">
              {filteredHistory.map((chat) => (
                <Button
                  key={chat.id}
                  variant={chat.id === activeChatId ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start gap-2 text-xs truncate"
                  onClick={() => handleSelectHistoryChat(chat)}
                >
                  <MessageSquare className="h-3 w-3" />
                  <span className="truncate">{chat.title}</span>
                </Button>
              ))}
            </div>
          ) : (
            <p className="px-1 text-[11px] text-muted-foreground">
              No chats yet. Start a conversation and save it with "New project".
            </p>
          )}
        </ScrollArea>

        {/* Account menu */}
        <div className="px-3 py-3 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-full flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-accent transition text-left"
                type="button"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[10px]">J</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-xs font-medium">Jighyyy</span>
                  <span className="text-[10px] text-muted-foreground" />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="w-64 rounded-2xl"
            >
              <div className="flex items-center gap-3 px-3 pt-3 pb-2">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs">JI</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-tight">
                    Jighyyy
                  </span>
                  <span className="text-xs text-muted-foreground leading-tight">
                    @jighyyy.k05
                  </span>
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-sm cursor-pointer"
                onClick={handlePersonalization}
              >
                Personalization
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-sm cursor-pointer"
                onClick={handleSettings}
              >
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-sm cursor-pointer flex items-center"
                onClick={handleHelp}
              >
                <span>Help</span>
                <ChevronRight className="h-3 w-3 ml-auto" />
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-sm cursor-pointer text-destructive"
                onClick={handleLogout}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* RIGHT MAIN AREA */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="border-b bg-background/70 backdrop-blur">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <img
                src="public/favicon.png"
                alt="VisionX logo"
                className="h-10 w-10 rounded"
              />
              <div className="flex flex-col leading-tight">
                <span className="font-medium text-lg">VisionX</span>
                <Badge variant="outline" className="text-[10px] mt-0.5">
                  Powered by GPT-OSS
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Image history dialog */}
              <Dialog
                open={isImageHistoryOpen}
                onOpenChange={setIsImageHistoryOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open image history"
                  >
                    <History className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Image history</DialogTitle>
                  </DialogHeader>
                  {imageHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No images uploaded in this chat yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {imageHistory.map((src, idx) => (
                        <div
                          key={`${src}-${idx}`}
                          className="relative overflow-hidden rounded-lg border border-border"
                        >
                          <img
                            src={src}
                            alt={`Uploaded ${idx + 1}`}
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* --- New: Feedback dialog button --- */}
              <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open feedback form"
                    title="Feedback"
                  >
                    <FileText className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Image Feedback</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs block mb-1">Upload image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onFeedbackFileChange}
                        className="block"
                      />
                      {feedbackImage && (
                        <img
                          src={feedbackImage}
                          alt="feedback preview"
                          className="mt-2 w-full h-40 object-contain rounded border border-border"
                        />
                      )}
                    </div>

                    <div>
                      <label className="text-xs block mb-1">
                        GPT-OSS summary
                      </label>
                      <Textarea
                        value={feedbackGptSummary}
                        onChange={(e) => setFeedbackGptSummary(e.target.value)}
                        placeholder="Paste or edit the summary provided by GPT-OSS"
                        className="h-24"
                      />
                    </div>

                    <div>
                      <label className="text-xs block mb-1">
                        Your suggested summary
                      </label>
                      <Textarea
                        value={feedbackUserSummary}
                        onChange={(e) => setFeedbackUserSummary(e.target.value)}
                        placeholder="Write the summary you'd prefer for this image"
                        className="h-24"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          // reset & close
                          setFeedbackImage(null);
                          setFeedbackGptSummary("");
                          setFeedbackUserSummary("");
                          setIsFeedbackOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          submitFeedback();
                        }}
                      >
                        Submit
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Dark-mode toggle */}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle dark mode"
                onClick={() => setIsDark((prev) => !prev)}
              >
                {isDark ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <div className="max-w-5xl mx-auto h-full px-6 py-6 flex">
            <Card className="flex-1 flex flex-col bg-background/60 border-border/60 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Conversation</CardTitle>
                <CardDescription>
                  Upload EO images and ask questions to get natural language
                  analysis.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 pr-4 max-h-[calc(100vh-320px)]">
                  <div className="space-y-4 pb-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              AI
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {message.images && message.images.length > 0 && (
                            <div
                              className={`mb-2 grid gap-2 ${
                                message.images.length > 1
                                  ? "grid-cols-2"
                                  : "grid-cols-1"
                              }`}
                            >
                              {message.images.map((img, idx) => (
                                <img
                                  key={`${img}-${idx}`}
                                  src={img}
                                  alt="Uploaded EO"
                                  className="w-full h-32 object-cover rounded-md"
                                />
                              ))}
                            </div>
                          )}

                          {!message.images &&
                            message.image &&
                            message.image.length > 0 && (
                              <div className="mb-2 rounded overflow-hidden">
                                <img
                                  src={message.image}
                                  alt="Uploaded EO"
                                  className="w-full h-32 object-cover"
                                />
                              </div>
                            )}

                          <p className="whitespace-pre-line">
                            {message.content}
                          </p>
                          <p className="text-[10px] opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>

                        {message.role === "user" && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                              U
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}

                    {isAnalyzing && (
                      <div className="flex gap-3 justify-start">
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            AI
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-2xl px-4 py-3 max-w-[80%] text-sm flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <p>Analyzing EO data...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>

              <CardFooter className="flex-col gap-4 border-t pt-4">
                <div className="w-full">
                  <p className="text-xs text-muted-foreground mb-2">
                    Quick actions:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((action) => (
                      <Button
                        key={action.label}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAction(action.label)}
                        className="text-xs"
                      >
                        <action.icon className="h-3 w-3 mr-1" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Uploaded thumbnails area */}
                {uploadedImages.length > 0 && (
                  <div className="w-full flex flex-wrap gap-3 items-end">
                    {uploadedImages.map((img, idx) => (
                      <div key={img.id} className="relative inline-block">
                        <img
                          src={img.src}
                          alt={`Upload preview ${idx + 1}`}
                          className="h-20 w-20 rounded object-cover border-2 border-border"
                        />

                        {/* Buttons: dropdown (V) then delete (X) side-by-side */}
                        <div className="absolute -top-2 right-0 flex gap-1">
                          <button
                            ref={(el) => (anchorRefs.current[img.id] = el)}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleImageDropdown(idx);
                            }}
                            className="h-6 w-6 rounded-full bg-white border border-border shadow flex items-center justify-center"
                            aria-label="Image options"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>

                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-6 w-6"
                            onClick={() => removeUploadedImage(idx)}
                            aria-label="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Portal-based dropdown panel (prevents clipping) */}
                        <DropdownPortal
                          anchorRef={{
                            current: anchorRefs.current[img.id] ?? null,
                          }}
                          open={!!img.dropdownOpen}
                          onClose={() =>
                            setUploadedImages((prev) =>
                              prev.map((im, i) =>
                                i === idx ? { ...im, dropdownOpen: false } : im
                              )
                            )
                          }
                          offset={{ x: -6, y: 8 }}
                        >
                          <div
                            className="w-[240px] bg-background border border-border rounded-md shadow-lg z-[9999] p-3 text-sm"
                            role="dialog"
                            aria-modal="false"
                          >
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={img.options.preProcessing}
                                onChange={(e) =>
                                  updateImageOption(idx, {
                                    preProcessing: e.target.checked,
                                  })
                                }
                              />
                              <span>Pre-processing</span>
                            </label>

                            <label className="flex items-center gap-2 mt-2">
                              <input
                                type="checkbox"
                                checked={img.options.atmosphericCorrections}
                                onChange={(e) =>
                                  updateImageOption(idx, {
                                    atmosphericCorrections: e.target.checked,
                                  })
                                }
                              />
                              <span>Atmospheric corrections</span>
                            </label>

                            <label className="flex items-center gap-2 mt-2">
                              <input
                                type="checkbox"
                                checked={img.options.cloudMasking}
                                onChange={(e) =>
                                  updateImageOption(idx, {
                                    cloudMasking: e.target.checked,
                                  })
                                }
                              />
                              <span>Cloud masking</span>
                            </label>

                            <label className="flex items-center gap-2 mt-2">
                              <input
                                type="checkbox"
                                checked={img.options.filters}
                                onChange={(e) =>
                                  updateImageOption(idx, {
                                    filters: e.target.checked,
                                  })
                                }
                              />
                              <span>Filters</span>
                            </label>

                            <div className="flex items-center justify-between mt-3">
                              <button
                                type="button"
                                className="text-sm font-medium"
                                onClick={() => applyOptionsToAll(idx)}
                              >
                                Apply to all
                              </button>

                              <Button
                                size="sm"
                                variant="default"
                                onClick={() =>
                                  setUploadedImages((prev) =>
                                    prev.map((im, i) =>
                                      i === idx
                                        ? { ...im, dropdownOpen: false }
                                        : im
                                    )
                                  )
                                }
                              >
                                Done
                              </Button>
                            </div>
                          </div>
                        </DropdownPortal>
                      </div>
                    ))}
                  </div>
                )}

                <div className="w-full flex gap-2 items-end">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload">
                      <Button variant="outline" size="icon" asChild>
                        <span>
                          <Upload className="h-4 w-4" />
                        </span>
                      </Button>
                    </label>
                  </div>

                  <Textarea
                    placeholder="Ask about land cover, vegetation, water resources, or upload an EO image... (Enter to send, Shift+Enter for newline)"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="flex-1 min-h-[60px] resize-none"
                  />

                  <Button
                    onClick={handleSend}
                    disabled={
                      input.trim() === "" && uploadedImages.length === 0
                    }
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChatPanel;
