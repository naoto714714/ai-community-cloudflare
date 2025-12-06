import { create } from 'zustand';

// Types
export type User = {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "offline" | "busy";
  isBot: boolean;
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

// Mock Users (Bots)
export const INITIAL_USERS: User[] = [
  { id: "u1", name: "Sarah", status: "online", isBot: true },
  { id: "u2", name: "Mike", status: "busy", isBot: true },
  { id: "u3", name: "Design Bot", status: "online", isBot: true },
  { id: "u4", name: "Dev Bot", status: "offline", isBot: true },
  { id: "u5", name: "QA Bot", status: "online", isBot: true },
  { id: "u6", name: "Manager Bot", status: "busy", isBot: true },
  { id: "u7", name: "HR Bot", status: "offline", isBot: true },
  { id: "me", name: "You", status: "online", isBot: false },
];

// Mock Channels
export const INITIAL_CHANNELS: Channel[] = [
  { id: "c1", name: "general", description: "General discussion for everyone", members: ["u1", "u2", "u3", "me"], unread: 0, type: "public" },
  { id: "c2", name: "random", description: "Random fun stuff", members: ["u1", "u4", "me"], unread: 2, type: "public" },
  { id: "c3", name: "design-team", description: "Design related topics", members: ["u1", "u3", "me"], unread: 0, type: "public" },
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
    { id: "m1", text: "Welcome to general!", senderId: "u3", channelId: "c1", timestamp: new Date(Date.now() - 100000) }
  ],
  activeChannelId: "c1",

  setActiveChannel: (id) => set({ activeChannelId: id }),
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  addChannel: (channel) => set((state) => ({ 
    channels: [...state.channels, channel] 
  })),
  
  updateChannel: (id, updates) => set((state) => ({
    channels: state.channels.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  
  addUser: (user) => set((state) => ({ 
    users: [...state.users, user] 
  })),
  
  removeUser: (id) => set((state) => ({ 
    users: state.users.filter(u => u.id !== id) 
  })),
}));
