import { format } from "date-fns";
import { motion } from "framer-motion";
import { Send, Hash, Bot, Plus, Search, Bell, MoreVertical, Smile, ChevronDown, Users } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchChannels } from "@/lib/channel-api";
import { requestGemini as requestGeminiApi } from "@/lib/gemini-api";
import { createMessage, fetchMessagesByChannel } from "@/lib/message-api";
import { useAppStore } from "@/lib/store";
import { fetchUsers } from "@/lib/user-api";
import { cn } from "@/lib/utils";
import ChannelDialog from "./ChannelDialog";
import UserListDialog from "./UserListDialog";

const DEFAULT_AUTO_CHAT_INTERVAL_SEC = 60;
const GEMINI_USER_ID = "gemini";

export default function ChatLayout() {
  const {
    users,
    channels,
    messages,
    activeChannelId,
    setUsers,
    setActiveChannel,
    setChannels,
    addMessage,
    setMessagesForChannel,
  } = useAppStore();

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [channelDialogMode, setChannelDialogMode] = useState<"create" | "edit">("create");
  const [userListOpen, setUserListOpen] = useState(false);
  const [userListIds, setUserListIds] = useState<string[] | undefined>(undefined);
  const [userListTitle, setUserListTitle] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  const activeChannel = channels.find((c) => c.name === activeChannelId) || channels[0];
  const currentMessages = activeChannel ? messages.filter((m) => m.channelId === activeChannel.name) : [];
  const channelMembers = activeChannel ? users.filter((u) => activeChannel.members.includes(u.id)) : [];

  // ユーザー読み込み（Markdown frontmatter）
  useEffect(() => {
    const controller = new AbortController();
    const loadUsers = async () => {
      try {
        const loaded = await fetchUsers();
        if (!controller.signal.aborted) setUsers(loaded);
      } catch (e) {
        if (!controller.signal.aborted) console.error("Load users error", e);
      }
    };
    loadUsers();
    return () => controller.abort();
  }, [setUsers]);

  // 初期ロード: チャンネル一覧取得
  useEffect(() => {
    const controller = new AbortController();

    const loadChannels = async () => {
      try {
        const normalized = await fetchChannels(controller.signal);
        setChannels(normalized);
        if (!activeChannelId && normalized[0]?.name) {
          setActiveChannel(normalized[0].name);
        }
      } catch (error: unknown) {
        const isAbort =
          typeof error === "object" &&
          error !== null &&
          "name" in error &&
          (error as { name?: string }).name === "AbortError";
        if (isAbort) return;
        console.error("Load channels error", error);
      }
    };

    loadChannels();

    return () => controller.abort();
  }, [activeChannelId, setActiveChannel, setChannels]);

  const persistMessage = useCallback(async (channelId: string, senderId: string, content: string) => {
    try {
      await createMessage({
        channel_id: channelId,
        user_id: senderId,
        content,
      });
    } catch (error) {
      console.error("Persist message error", error);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages, activeChannelId]);

  // Fetch messages for active channel
  useEffect(() => {
    if (!activeChannelId) return;

    const abortController = new AbortController();
    let isCancelled = false;

    const fetchMessages = async () => {
      try {
        const data = await fetchMessagesByChannel(activeChannelId, abortController.signal);
        if (isCancelled) return;
        setMessagesForChannel(activeChannelId, data);
      } catch (error: unknown) {
        const isAbort =
          typeof error === "object" &&
          error !== null &&
          "name" in error &&
          (error as { name?: string }).name === "AbortError";
        if (isCancelled || isAbort) return;
        console.error("Fetch messages error", error);
      }
    };

    fetchMessages();

    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [activeChannelId, setMessagesForChannel]);

  useEffect(() => {
    const autoChatIntervalMs = DEFAULT_AUTO_CHAT_INTERVAL_SEC * 1000;
    if (!activeChannelId) return;

    let isCancelled = false;
    const channelId = activeChannelId;
    const abortController = new AbortController();

    const requestGemini = async () => {
      try {
        const data = await requestGeminiApi(
          {
            user_prompt: "こんにちは",
          },
          abortController.signal,
        );

        if (isCancelled || !data?.reply) return;

        addMessage({
          id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
          text: data.reply,
          senderId: GEMINI_USER_ID,
          channelId,
          timestamp: new Date(),
        });
        void persistMessage(channelId, GEMINI_USER_ID, data.reply);
      } catch (error: unknown) {
        if (!isCancelled) {
          console.error("Gemini fetch error", error);
        }
      }
    };

    requestGemini();

    const intervalId = window.setInterval(requestGemini, autoChatIntervalMs);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
      abortController.abort();
    };
  }, [activeChannelId, addMessage, persistMessage]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    const channelId = activeChannel?.name || activeChannelId;

    if (!channelId) return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputText,
      senderId: "me",
      channelId,
      timestamp: new Date(),
    };

    addMessage(newMessage);
    void persistMessage(channelId, "me", inputText);
    setInputText("");
    setIsTyping(true);

    // Random Bot Auto-reply
    setTimeout(() => {
      // Filter bots (users who are not 'me') that are members of the current channel
      const availableBots = channelMembers.filter((u) => u.id !== "me" && u.id !== GEMINI_USER_ID);

      if (availableBots.length > 0) {
        const randomBot = availableBots[Math.floor(Math.random() * availableBots.length)];

        const replyMessage = {
          id: (Date.now() + 1).toString(),
          text: "こんにちは",
          senderId: randomBot.id,
          channelId: activeChannelId,
          timestamp: new Date(),
        };
        addMessage(replyMessage);
      }
      setIsTyping(false);
    }, 1500);
  };

  const openCreateChannel = () => {
    setChannelDialogMode("create");
    setChannelDialogOpen(true);
  };

  const openEditChannel = () => {
    if (!activeChannel) return;
    setChannelDialogMode("edit");
    setChannelDialogOpen(true);
  };

  const openAllUsers = () => {
    setUserListIds(undefined);
    setUserListTitle("All Users");
    setUserListOpen(true);
  };

  const openChannelMembers = () => {
    if (!activeChannel) return;
    setUserListIds(activeChannel.members);
    setUserListTitle(`#${activeChannel.name} Members`);
    setUserListOpen(true);
  };

  return (
    <div className="flex h-screen w-full bg-[var(--color-soft-bg)] p-4 gap-4 overflow-hidden font-sans text-[var(--color-soft-text)]">
      {/* Sidebar - Floating Island */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-64 hidden md:flex flex-col bg-white rounded-[2rem] shadow-sm border border-white/50 backdrop-blur-sm overflow-hidden"
      >
        {/* Workspace Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h1 className="font-bold text-xl tracking-tight text-[var(--color-soft-blue)]">SoftChat</h1>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-[var(--color-soft-bg)] text-gray-400">
            <Bell size={18} />
          </Button>
        </div>

        {/* Channel List */}
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-6">
            {/* Channels Section */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2 group">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Channels</h2>
                <Plus
                  size={14}
                  className="text-gray-400 opacity-0 group-hover:opacity-100 cursor-pointer hover:text-[var(--color-soft-blue)] transition-opacity"
                  onClick={openCreateChannel}
                />
              </div>
              <div className="space-y-1">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setActiveChannel(channel.name)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ease-spring",
                      activeChannelId === channel.name
                        ? "bg-[var(--color-soft-blue)] text-white shadow-md shadow-blue-200 scale-[1.02]"
                        : "text-gray-600 hover:bg-gray-50 hover:scale-[1.01]",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Hash
                        size={16}
                        className={cn(activeChannelId === channel.name ? "text-blue-100" : "text-gray-400")}
                      />
                      <span className="truncate">{channel.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Messages Section */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2 group cursor-pointer" onClick={openAllUsers}>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-[var(--color-soft-blue)] transition-colors">
                  Direct Messages
                </h2>
                <Users
                  size={14}
                  className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-[var(--color-soft-blue)] transition-opacity"
                />
              </div>
              <div className="space-y-1">
                {users
                  .filter((u) => u.id !== "me")
                  .slice(0, 5)
                  .map((user) => (
                    <button
                      key={user.id}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <div className="relative">
                        <div className="w-2 h-2 rounded-full absolute bottom-0 right-0 ring-2 ring-white bg-gray-300"></div>
                        <Avatar className="w-6 h-6">
                          {user.id !== "me" ? (
                            <div className="w-full h-full bg-[var(--color-soft-cyan)] flex items-center justify-center text-white text-[10px]">
                              <Bot size={14} />
                            </div>
                          ) : (
                            <AvatarImage src="https://github.com/shadcn.png" />
                          )}
                          <AvatarFallback className="text-[10px]">{user.name[0]}</AvatarFallback>
                        </Avatar>
                      </div>
                      <span className="truncate">{user.name}</span>
                    </button>
                  ))}
                {users.length > 6 && (
                  <button
                    onClick={openAllUsers}
                    className="w-full text-left px-3 py-1 text-xs text-gray-400 hover:text-[var(--color-soft-blue)] transition-colors"
                  >
                    + {users.length - 6} more...
                  </button>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 border-2 border-white shadow-sm">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-700 truncate">You</p>
              <p className="text-xs text-gray-400 truncate">User</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Chat Area - Floating Island */}
      <motion.main
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 flex flex-col bg-white rounded-[2rem] shadow-sm border border-white/50 overflow-hidden relative"
      >
        {/* Chat Header */}
        <header className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-10 sticky top-0">
          <div
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
            onClick={openEditChannel}
          >
            <Hash className="text-gray-400" size={20} />
            <div>
              <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                {activeChannel?.name ?? "No Channel"}
                <ChevronDown size={14} className="text-gray-400" />
              </h2>
              {activeChannel?.description && (
                <p className="text-xs text-gray-400 truncate max-w-[300px]">{activeChannel.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="flex -space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={openChannelMembers}
            >
              {channelMembers.slice(0, 3).map((member) => (
                <div
                  key={member.id}
                  className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center overflow-hidden"
                >
                  {member.id !== "me" ? (
                    <div className="w-full h-full bg-[var(--color-soft-cyan)] flex items-center justify-center text-white">
                      <Bot size={14} />
                    </div>
                  ) : (
                    <Avatar className="w-full h-full">
                      <AvatarImage src="https://github.com/shadcn.png" />
                      <AvatarFallback>ME</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {channelMembers.length > 3 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-bold">
                  +{channelMembers.length - 3}
                </div>
              )}
            </div>
            <div className="h-4 w-px bg-gray-200"></div>
            <Search className="text-gray-400 cursor-pointer hover:text-gray-600" size={20} />
            <MoreVertical className="text-gray-400 cursor-pointer hover:text-gray-600" size={20} />
          </div>
        </header>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {currentMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                <Hash size={40} className="text-gray-300" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-600">
                  {activeChannel ? `Welcome to #${activeChannel.name}!` : "チャンネルを作成してください"}
                </p>
                <p className="text-sm text-gray-400 mt-1">This is the start of the channel.</p>
                {activeChannel?.description && (
                  <p className="text-sm text-[var(--color-soft-blue)] mt-2 bg-blue-50 px-3 py-1 rounded-full inline-block">
                    Topic: {activeChannel.description}
                  </p>
                )}
              </div>
            </div>
          ) : (
            currentMessages.map((msg, index) => {
              const isMe = msg.senderId === "me";
              const sender = users.find((u) => u.id === msg.senderId);
              const showAvatar = index === 0 || currentMessages[index - 1].senderId !== msg.senderId;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={cn("flex gap-3 max-w-[80%]", isMe ? "ml-auto flex-row-reverse" : "")}
                >
                  {/* Avatar */}
                  <div className={cn("w-10 h-10 flex-shrink-0", !showAvatar && "opacity-0")}>
                    <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                      {isMe ? (
                        <AvatarImage src="https://github.com/shadcn.png" />
                      ) : (
                        <div className="w-full h-full bg-[var(--color-soft-cyan)] flex items-center justify-center text-white">
                          <Bot size={20} />
                        </div>
                      )}
                    </Avatar>
                  </div>

                  {/* Message Bubble */}
                  <div className={cn("flex flex-col gap-1", isMe ? "items-end" : "items-start")}>
                    {showAvatar && (
                      <div className="flex items-baseline gap-2 ml-1">
                        <span className="text-xs font-bold text-gray-500">{sender?.name || "Unknown"}</span>
                        {!isMe && sender?.personality && (
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                            {sender.personality}
                          </span>
                        )}
                      </div>
                    )}
                    <div
                      className={cn(
                        "px-5 py-3 rounded-2xl shadow-sm text-[15px] leading-relaxed relative group transition-all duration-200 hover:shadow-md",
                        isMe
                          ? "bg-[var(--color-soft-blue)] text-white rounded-tr-none"
                          : "bg-[var(--color-soft-gray)] text-gray-800 rounded-tl-none",
                      )}
                    >
                      {msg.text}
                      <span
                        className={cn(
                          "text-[10px] absolute bottom-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap",
                          isMe ? "right-full mr-2 text-gray-400" : "left-full ml-2 text-gray-400",
                        )}
                      >
                        {format(msg.timestamp, "HH:mm")}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-300 px-1">{format(msg.timestamp, "HH:mm")}</span>
                  </div>
                </motion.div>
              );
            })
          )}
          {isTyping && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
              <div className="w-10 h-10 flex-shrink-0">
                <div className="w-full h-full bg-[var(--color-soft-cyan)] rounded-full flex items-center justify-center text-white">
                  <Bot size={20} />
                </div>
              </div>
              <div className="bg-[var(--color-soft-gray)] px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 pt-2 bg-white">
          <form
            onSubmit={handleSendMessage}
            className="relative flex items-center gap-2 bg-gray-50 p-2 rounded-[1.5rem] border border-gray-200 focus-within:border-[var(--color-soft-blue)] focus-within:ring-4 focus-within:ring-blue-50 transition-all duration-300"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200"
            >
              <Plus size={20} />
            </Button>

            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message #${activeChannel?.name ?? ""}`}
              className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 text-base placeholder:text-gray-400 h-12"
            />

            <div className="flex items-center gap-1 pr-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200"
              >
                <Smile size={20} />
              </Button>
              <Button
                type="submit"
                size="icon"
                disabled={!inputText.trim()}
                className={cn(
                  "rounded-full w-10 h-10 transition-all duration-300 ease-spring",
                  inputText.trim()
                    ? "bg-[var(--color-soft-blue)] hover:bg-blue-600 text-white shadow-lg shadow-blue-200 hover:scale-110 active:scale-95"
                    : "bg-gray-200 text-gray-400",
                )}
              >
                <Send size={18} className={cn(inputText.trim() && "ml-0.5")} />
              </Button>
            </div>
          </form>
          <div className="text-center mt-2">
            <p className="text-[10px] text-gray-400">
              <strong>Tip:</strong> Press <kbd className="font-sans bg-gray-100 px-1 rounded">Enter</kbd> to send
            </p>
          </div>
        </div>
      </motion.main>

      {/* Dialogs */}
      <ChannelDialog
        isOpen={channelDialogOpen}
        onClose={() => setChannelDialogOpen(false)}
        mode={channelDialogMode}
        channelId={activeChannelId}
      />
      <UserListDialog
        isOpen={userListOpen}
        onClose={() => setUserListOpen(false)}
        userIds={userListIds}
        title={userListTitle}
      />
    </div>
  );
}
