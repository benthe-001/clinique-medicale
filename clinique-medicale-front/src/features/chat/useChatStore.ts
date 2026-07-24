// src/features/chat/useChatStore.ts

import { create } from "zustand";
import type { ChatMessage } from "./types";

interface ChatState {
  conversations: Record<string, ChatMessage[]>;
  notifications: ChatMessage[];
  unreadCounts: Record<string, number>;
  conversationOuverteId: string | null;
  estConnecte: boolean;

  setEstConnecte: (value: boolean) => void;
  setConversationHistory: (userId: string, messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage, currentUserId: string) => void;
  addNotification: (notification: ChatMessage) => void;
  markNotificationsRead: () => void;
  setUnreadCounts: (counts: Record<string, number>) => void;
  incrementUnread: (contactId: string) => void;
  clearUnread: (contactId: string) => void;
  setConversationOuverte: (id: string | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: {},
  notifications: [],
  unreadCounts: {},
  conversationOuverteId: null,
  estConnecte: false,

  setEstConnecte: (value) => set({ estConnecte: value }),

  setConversationHistory: (userId, messages) =>
    set((state) => ({
      conversations: { ...state.conversations, [userId]: messages },
    })),

  addMessage: (message, currentUserId) =>
    set((state) => {
      const autreUtilisateur =
        message.expediteurId === currentUserId
          ? message.destinataireId
          : message.expediteurId;
      if (!autreUtilisateur) return state;
      const existants = state.conversations[autreUtilisateur] ?? [];
      return {
        conversations: {
          ...state.conversations,
          [autreUtilisateur]: [...existants, message],
        },
      };
    }),

  addNotification: (notification) =>
    set((state) => ({ notifications: [notification, ...state.notifications] })),

  markNotificationsRead: () => set({ notifications: [] }),

  setUnreadCounts: (counts) => set({ unreadCounts: counts }),

  incrementUnread: (contactId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [contactId]: (state.unreadCounts[contactId] ?? 0) + 1,
      },
    })),

  clearUnread: (contactId) =>
    set((state) => {
      if (!(contactId in state.unreadCounts)) return state;
      const reste = { ...state.unreadCounts };
      delete reste[contactId];
      return { unreadCounts: reste };
    }),

  setConversationOuverte: (id) => set({ conversationOuverteId: id }),
}));
