// src/presentation/components/Sidebar.tsx

import { NavLink } from "react-router-dom";
import { LogOut, Stethoscope } from "lucide-react";
import type { ReactNode } from "react";
import { useChatStore } from "../../features/chat/useChatStore";

export interface SidebarItem {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

interface SidebarProps {
  items: SidebarItem[];
  title: string;
  userName: string;
  roleLabel: string;
  onLogout: () => void;
  headerExtra?: ReactNode;
}

export function Sidebar({
  items,
  title,
  userName,
  roleLabel,
  onLogout,
  headerExtra,
}: SidebarProps) {
  const estConnecte = useChatStore((state) => state.estConnecte);
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 text-white">
            <Stethoscope className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-gray-900">{title}</span>
        </div>
        {headerExtra}
      </div>

      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
        <div className="relative">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
            {userName.charAt(0).toUpperCase()}
          </div>
          {/* Indicateur en ligne/hors ligne */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
              estConnecte ? "bg-green-500" : "bg-gray-400"
            }`}
            title={estConnecte ? "En ligne" : "Hors ligne"}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{userName}</p>
          <p className="text-xs text-gray-500">{roleLabel}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            {item.icon}
            {item.label}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-600 px-1.5 text-[11px] font-semibold text-white">
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-danger-600 hover:bg-danger-50"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
