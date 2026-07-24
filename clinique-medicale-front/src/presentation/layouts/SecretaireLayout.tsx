// src/presentation/layouts/SecretaireLayout.tsx

import { Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Receipt,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../../application/auth/useAuth";
import { Sidebar } from "../components/Sidebar";
import { getNomComplet } from "../../domain/user";
import { useChatConnection } from "../../features/chat/useChatConnection";
import { useUnreadCounts } from "../../features/chat/useUnreadCounts";
import { useTotalUnreadCount } from "../../features/chat/useTotalUnreadCount";
import type { SidebarItem } from "../components/Sidebar";
import { NotificationBell } from "../components/NotificationBell";

export default function SecretaireLayout() {
  const user = useAuth((state) => state.user);
  const logout = useAuth((state) => state.logout);
  const navigate = useNavigate();

  useChatConnection();
  useUnreadCounts();
  const unreadTotal = useTotalUnreadCount();

  const items: SidebarItem[] = [
    {
      to: "/secretaire/dashboard",
      label: "Tableau de bord",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      to: "/secretaire/patients",
      label: "Patients",
      icon: <Users className="h-4 w-4" />,
    },
    {
      to: "/secretaire/rendez-vous",
      label: "Rendez-vous",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      to: "/secretaire/facturation",
      label: "Facturation",
      icon: <Receipt className="h-4 w-4" />,
    },
    {
      to: "/secretaire/messagerie",
      label: "Messagerie",
      icon: <MessageSquare className="h-4 w-4" />,
      badge: unreadTotal,
    },
  ];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        items={items}
        title="Clinique Médicale"
        userName={user ? getNomComplet(user) : ""}
        roleLabel="SECRÉTAIRE"
        onLogout={handleLogout}
        headerExtra={<NotificationBell />}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
