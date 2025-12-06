import { create } from "zustand";

// Types
export type User = {
  id: string;
  name: string;
  avatar?: string;
  personality: string; // status/isBotの代わりにpersonalityを追加
};

export type Channel = {
  id: string;
  name: string;
  description: string; // 話すテーマ
  members: string[]; // User IDs
  unread: number;
  type: "public" | "private";
};

export type Message = {
  id: string;
  text: string;
  senderId: string;
  channelId: string;
  timestamp: Date;
};

// Mock Users (All are bots except 'me')
export const INITIAL_USERS: User[] = [
  { id: "u1", name: "Sarah", personality: "Cheerful & Helpful" },
  { id: "u2", name: "Mike", personality: "Sarcastic & Witty" },
  { id: "u3", name: "Design Bot", personality: "Creative & Artistic" },
  { id: "u4", name: "Dev Bot", personality: "Logical & Precise" },
  { id: "u5", name: "News Bot", personality: "Informative & Neutral" },
  { id: "u6", name: "Game Bot", personality: "Playful & Competitive" },
  { id: "me", name: "You", personality: "User" },
];

// Mock Channels
export const INITIAL_CHANNELS: Channel[] = [
  {
    id: "c1",
    name: "雑談",
    description: "何でも自由に話せる場所",
    members: ["u1", "u2", "u3", "u4", "me"],
    unread: 0,
    type: "public",
  },
  {
    id: "c2",
    name: "ゲーム",
    description: "ゲームに関する話題",
    members: ["u1", "u6", "me"],
    unread: 2,
    type: "public",
  },
  {
    id: "c3",
    name: "ニュース",
    description: "最新のニュースや情報",
    members: ["u1", "u5", "me"],
    unread: 0,
    type: "public",
  },
];

// Store State
interface AppState {
  users: User[];
  channels: Channel[];
  messages: Message[];
  activeChannelId: string;

  // Actions
  setActiveChannel: (id: string) => void;
  addMessage: (message: Message) => void;
  addChannel: (channel: Channel) => void;
  updateChannel: (id: string, updates: Partial<Channel>) => void;
  addUser: (user: User) => void;
  removeUser: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  users: INITIAL_USERS,
  channels: INITIAL_CHANNELS,
  messages: [
    {
      id: "m1",
      text: "こんにちは！雑談チャンネルへようこそ。",
      senderId: "u1",
      channelId: "c1",
      timestamp: new Date(Date.now() - 100000),
    },
  ],
  activeChannelId: "c1", // 初期チャンネルは「雑談」

  setActiveChannel: (id) => set({ activeChannelId: id }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  addChannel: (channel) =>
    set((state) => ({
      channels: [...state.channels, channel],
    })),

  updateChannel: (id, updates) =>
    set((state) => ({
      channels: state.channels.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),

  addUser: (user) =>
    set((state) => ({
      users: [...state.users, user],
    })),

  removeUser: (id) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
    })),
}));
