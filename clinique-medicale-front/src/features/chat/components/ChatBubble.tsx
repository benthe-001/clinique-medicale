// src/features/chat/components/ChatBubble.tsx

import { useState } from "react";
import { X } from "lucide-react";
import type { ChatMessage } from "../types";
import { getImageUrl } from "../chatService";

interface ChatBubbleProps {
  message: ChatMessage;
  estMoi: boolean;
}

export function ChatBubble({ message, estMoi }: ChatBubbleProps) {
  const [pleinEcran, setPleinEcran] = useState(false);

  return (
    <>
      <div
        className={`flex items-end gap-2 ${estMoi ? "justify-end" : "justify-start"}`}
      >
        {!estMoi && (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
            {message.expediteurNom.charAt(0).toUpperCase()}
          </div>
        )}
        <div
          className={`max-w-xs rounded-2xl px-3 py-2 text-sm shadow-sm ${
            estMoi
              ? "rounded-br-sm bg-primary-600 text-white"
              : "rounded-bl-sm border border-gray-200 bg-white text-gray-900"
          }`}
        >
          {!estMoi && (
            <p className="mb-0.5 text-xs font-semibold text-primary-600">
              {message.expediteurNom}
            </p>
          )}
          {message.imageUrl && (
            <img
              src={getImageUrl(message.imageUrl)}
              alt="Image envoyée"
              onClick={() => setPleinEcran(true)}
              className="mb-1 max-h-56 w-full cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-90"
              title="Cliquer pour agrandir"
            />
          )}
          {message.contenu.trim() && (
            <p className="whitespace-pre-wrap break-words">{message.contenu}</p>
          )}
          <p
            className={`mt-1 text-right text-[11px] ${
              estMoi ? "text-primary-100" : "text-gray-400"
            }`}
          >
            {new Date(message.createdAt).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* Visionneuse plein écran */}
      {pleinEcran && message.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setPleinEcran(false)}
        >
          <button
            type="button"
            onClick={() => setPleinEcran(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Fermer"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={getImageUrl(message.imageUrl)}
            alt="Image en plein écran"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
