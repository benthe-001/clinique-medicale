// src/features/chat/useChatConnection.ts

import { useEffect } from "react";
import type { Client } from "@stomp/stompjs";
import { createChatSocket } from "./chatSocket";
import { useChatStore } from "./useChatStore";
import { useAuth } from "../../application/auth/useAuth";

export function useChatConnection() {
  const user = useAuth((state) => state.user);
  const addMessage = useChatStore((state) => state.addMessage);
  const addNotification = useChatStore((state) => state.addNotification);
  const incrementUnread = useChatStore((state) => state.incrementUnread);
  const setEstConnecte = useChatStore((state) => state.setEstConnecte);

  useEffect(() => {
    if (!user) return;

    const client: Client = createChatSocket(
      user.id,
      (message) => {
        addMessage(message, user.id);
        const conversationOuverte =
          useChatStore.getState().conversationOuverteId;
        if (message.expediteurId !== conversationOuverte) {
          incrementUnread(message.expediteurId);
        }
      },
      (notification) => addNotification(notification),
      (connected) => setEstConnecte(connected),
    );

    return () => {
      setEstConnecte(false);
      client.deactivate();
    };
  }, [user, addMessage, addNotification, incrementUnread, setEstConnecte]);
}
