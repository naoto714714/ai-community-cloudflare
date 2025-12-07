import { create } from "zustand";

// Types
export type User = {
  id: string;
  name: string;
  avatar?: string;
  personality: string;
};

export type Channel = {
  id: string;
  name: string;
  description: string;
  members: string[];
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
  { id: "gemini", name: "Gemini", personality: "AI Assistant" },
  { id: "me", name: "You", personality: "User" },
];

// Store State
interface AppState {
  users: User[];
  channels: Channel[];
  messages: Message[];
  activeChannelId: string;

  // Actions
  setChannels: (channels: Channel[]) => void;
  setActiveChannel: (id: string) => void;
  addMessage: (message: Message) => void;
  setMessagesForChannel: (channelId: string, messages: Message[]) => void;
  addUser: (user: User) => void;
  removeUser: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  users: INITIAL_USERS,
  channels: [],
  messages: [],
  activeChannelId: "", // API取得後に設定

  setChannels: (channels) => set({ channels }),
  setActiveChannel: (id) => set({ activeChannelId: id }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setMessagesForChannel: (channelId, newMessages) =>
    set((state) => ({
      messages: [...state.messages.filter((m) => m.channelId !== channelId), ...newMessages],
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
