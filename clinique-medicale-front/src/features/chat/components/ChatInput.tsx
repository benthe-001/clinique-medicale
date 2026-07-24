// src/features/chat/components/ChatInput.tsx

import { useState, useRef } from "react";
import type { ChangeEvent } from "react";
import { Send, Paperclip, Loader2, X, Image } from "lucide-react";
import toast from "react-hot-toast";
import { chatService } from "../chatService";

interface ChatInputProps {
  onSend: (contenu: string, imageUrl?: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [texte, setTexte] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [imageEnAttente, setImageEnAttente] = useState<{
    url: string;
    nom: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleEnvoyer() {
    if (!texte.trim() && !imageEnAttente) return;
    onSend(texte.trim(), imageEnAttente?.url);
    setTexte("");
    setImageEnAttente(null);
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await chatService.uploaderImage(file);
      // Stocke l'image sans envoyer — l'utilisateur clique sur "Envoyer"
      setImageEnAttente({ url, nom: file.name });
    } catch {
      toast.error("Échec du chargement de l'image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSupprimerImage() {
    setImageEnAttente(null);
  }

  return (
    <div className="border-t border-gray-200 bg-white p-3">
      {/* Aperçu de l'image en attente */}
      {imageEnAttente && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <Image className="h-4 w-4 shrink-0 text-primary-600" />
          <span className="flex-1 truncate text-xs text-gray-600">
            {imageEnAttente.nom}
          </span>
          <button
            type="button"
            onClick={handleSupprimerImage}
            className="shrink-0 rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-danger-600"
            aria-label="Retirer l'image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-gray-50 px-2 py-1.5 focus-within:border-primary-600 focus-within:bg-white">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || isUploading || imageEnAttente !== null}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading || imageEnAttente !== null}
          className="shrink-0 rounded-full p-1.5 text-gray-500 hover:bg-gray-200 disabled:opacity-50"
          aria-label="Joindre une image"
          title={
            imageEnAttente
              ? "Une image est déjà en attente"
              : "Joindre une image"
          }
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Paperclip className="h-5 w-5" />
          )}
        </button>
        <input
          type="text"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleEnvoyer();
          }}
          placeholder={
            imageEnAttente
              ? "Ajouter un message (optionnel)..."
              : "Écrire un message..."
          }
          disabled={disabled}
          className="flex-1 bg-transparent text-sm focus:outline-none"
        />
        <button
          type="button"
          onClick={handleEnvoyer}
          disabled={disabled || (!texte.trim() && !imageEnAttente)}
          className="shrink-0 rounded-full bg-primary-600 p-2 text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          aria-label="Envoyer"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
