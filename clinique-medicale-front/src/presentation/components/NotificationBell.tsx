// src/presentation/components/NotificationBell.tsx

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "../../features/chat/chatService";
import { useAuth } from "../../application/auth/useAuth";
import { useChatStore } from "../../features/chat/useChatStore";
import type { ChatMessage } from "../../features/chat/types";

export function NotificationBell() {
  const user = useAuth((state) => state.user);
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const wsNotifications = useChatStore((state) => state.notifications);

  const { data: notifications } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => chatService.notificationsNonLues(user?.id ?? ""),
    enabled: Boolean(user),
    refetchInterval: 30000,
  });

  // Ferme le panneau si clic en dehors
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const dedupliquees = new Map<string, ChatMessage>();
  [...wsNotifications, ...(notifications ?? [])].forEach((n) =>
    dedupliquees.set(n.id, n),
  );
  const toutesNotifications = Array.from(dedupliquees.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const count = toutesNotifications.length;

  async function handleMarquerTout() {
    if (!user) return;
    await chatService.marquerTousLus(user.id);
    queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
    useChatStore.getState().markNotificationsRead();
    setIsOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative rounded-md p-2 text-gray-500 hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-600 text-[10px] font-semibold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-2 w-80 rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            {count > 0 && (
              <button
                onClick={handleMarquerTout}
                className="text-xs text-primary-600 hover:underline"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {toutesNotifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">
                Aucune notification
              </p>
            ) : (
              toutesNotifications.map((n) => (
                <div
                  key={n.id}
                  className="border-b border-gray-100 px-4 py-3 text-sm last:border-0"
                >
                  <p className="text-gray-900">{n.contenu}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(n.createdAt).toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
