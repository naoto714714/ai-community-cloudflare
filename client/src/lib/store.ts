import { create } from "zustand";

// Types
export type User = {
  // idとnameは同じ値
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

// Store State
interface AppState {
  users: User[];
  channels: Channel[];
  messages: Message[];
  activeChannelId: string;

  // Actions
  setUsers: (users: User[]) => void;
  setChannels: (channels: Channel[]) => void;
  setActiveChannel: (id: string) => void;
  addMessage: (message: Message) => void;
  setMessagesForChannel: (channelId: string, messages: Message[]) => void;
  addUser: (user: User) => void;
  removeUser: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  users: [],
  channels: [],
  messages: [],
  activeChannelId: "", // API取得後に設定

  setUsers: (users) => set({ users }),
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
