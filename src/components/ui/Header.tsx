"use client";

import { LuSearch as Search, LuBell as Bell, LuShield as Shield, LuWifi as Wifi, LuWifiOff as WifiOff } from "react-icons/lu";
import Link from "next/link";
import { useAuthStore, isAdmin, isOperator } from "@/stores/authStore";
import { useAlertStore } from "@/stores/alertStore";
import { useRealtimeSocket } from "@/hooks/useRealtimeSocket";

export function Header() {
  const { user } = useAuthStore();
  const { isConnected } = useRealtimeSocket();
  const alerts = useAlertStore((state) => state.alerts);
  const activeAlertsCount = alerts.filter((a) => a.status === "active").length;

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "?";

  const roleDisplay = isAdmin(user)
    ? "Administrator"
    : isOperator(user)
    ? "Operator"
    : "Viewer";

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tanks, buildings, or sensors..."
            className="pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus-visible:outline-2 focus-visible:outline-slate-500 transition-all outline-none w-64 md:w-80 text-slate-700"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isConnected ? (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <Wifi className="w-3.5 h-3.5" />
            <span>System online</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Connecting...</span>
          </div>
        )}

        <Link
          href="/alerts"
          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors relative"
          aria-label="View alerts"
        >
          <Bell className="w-5 h-5" />
          {activeAlertsCount > 0 && (
            <span className="min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center absolute -top-0.5 -right-0.5">
              {activeAlertsCount > 9 ? "9+" : activeAlertsCount}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm shadow-sm">
            {initials}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-700 leading-none">
              {user?.username || "User"}
            </p>
            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3 text-blue-500" />
              {roleDisplay}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
