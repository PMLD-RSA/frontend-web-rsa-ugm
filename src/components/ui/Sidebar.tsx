"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import type { IconType } from "react-icons";
import {
  LuBell,
  LuChartNoAxesColumn,
  LuChevronRight,
  LuCircle,
  LuClipboardList,
  LuDatabase,
  LuLayoutDashboard,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuRadio,
  LuUserRound,
  LuUsers,
} from "react-icons/lu";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LuInfo as Info,
  LuLoaderCircle as Loader2,
  LuX as X,
} from "react-icons/lu";
import { useAuthStore, isAdmin } from "@/stores/authStore";
import { useAlertStore } from "@/stores/alertStore";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";
import styles from "./Sidebar.module.css";


const accountAssets: Record<string, string> = {
  'account-control-panel': 'control-panel.svg',
  'account-control-arrow': 'control-arrow.svg',
  'account-profile': 'profile.svg',
  'account-profile-arrow': 'profile-arrow.svg',
  'account-password': 'password.svg',
  'account-password-arrow': 'password-arrow.svg',
  'account-logout': 'logout.svg',
  'account-logout-arrow': 'logout-arrow.svg',
};

function SidebarCollapseIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      width="20"
      height="12"
      viewBox="0 0 20 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{
        transform: isOpen ? "rotate(180deg)" : "none",
        transition: "transform 0.2s ease",
      }}
    >
      <line y1="0.5" x2="10" y2="0.5" stroke="#B8CBDD" />
      <line y1="10.5" x2="10" y2="10.5" stroke="#B8CBDD" />
      <path
        d="M14.6561 0.459449C14.4999 0.302873 14.2462 0.302874 14.0899 0.459451L13.7093 0.840813C13.5534 0.996959 13.5534 1.2498 13.7093 1.40595L16.7585 4.46108C17.0101 4.71318 16.8315 5.14365 16.4753 5.14365L4.15795e-05 5.14365C1.86395e-05 5.14365 0 5.14367 0 5.14369L0 6.48378C0 6.4838 1.88827e-05 6.48382 4.21756e-05 6.48382L16.4752 6.48382C16.8314 6.48382 17.0099 6.91429 16.7583 7.16639L13.7093 10.2214C13.5534 10.3775 13.5534 10.6304 13.7093 10.7865L14.0899 11.1679C14.2462 11.3245 14.4999 11.3245 14.6561 11.1679L19.718 6.09624C19.8738 5.94009 19.8738 5.68725 19.718 5.5311L14.6561 0.459449Z"
        fill="#ECF4F9"
      />
    </svg>
  );
}

interface SidebarAsset {
  name: string;
  width: number;
  height: number;
}

interface MenuItem {
  icon: SidebarAsset;
  label: string;
  href: string;
  badge?: boolean;
  adminOnly?: boolean;
}

const DASHBOARD: MenuItem = {
  icon: { name: "dashboard", width: 16.34, height: 16.34 },
  label: "Dashboard",
  href: "/",
};

const MENU_GROUPS: MenuItem[][] = [
  [
    {
      icon: { name: "tanks", width: 18, height: 18 },
      label: "Tanks",
      href: "/tanks",
    },
    {
      icon: { name: "reports", width: 18, height: 24 },
      label: "Reports",
      href: "/reports",
    },
    {
      icon: { name: "alerts", width: 18, height: 20 },
      label: "Alerts",
      href: "/alerts",
      badge: true,
    },
  ],
  [
    {
      icon: { name: "logs", width: 17.5245, height: 21.6019 },
      label: "Audit Log",
      href: "/logs",
    },
    {
      icon: { name: "users", width: 20, height: 16 },
      label: "Users",
      href: "/users",
      adminOnly: true,
    },
    {
      icon: { name: "devices", width: 18.84, height: 18.84 },
      label: "Devices",
      href: "/devices",
    },
  ],
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  operator: "Operator",
  viewer: "Viewer",
};

const sidebarIcons: Record<string, IconType> = {
  dashboard: LuLayoutDashboard,
  tanks: LuDatabase,
  reports: LuChartNoAxesColumn,
  alerts: LuBell,
  logs: LuClipboardList,
  users: LuUsers,
  devices: LuRadio,
  notification: LuCircle,
  "expanded-toggle": LuPanelLeftClose,
  "toggle-arrow": LuPanelLeftOpen,
  "account-chevron": LuChevronRight,
};

function SidebarIcon({ name, width, height }: SidebarAsset) {
  const accountAsset = accountAssets[name];
  if (accountAsset) return <Image src={`/images/account-menu/${accountAsset}`} alt="" width={width} height={height} unoptimized style={{ flexShrink: 0, maxWidth: 'none' }} />;
  if (name.includes("divider") || name === "toggle-line")
    return (
      <span
        aria-hidden="true"
        style={{
          display: "block",
          width,
          height,
          background: "currentColor",
          opacity: 0.35,
        }}
      />
    );
  const Icon = sidebarIcons[name];
  if (!Icon) throw new Error(`Unknown sidebar icon: ${name}`);
  return (
    <Icon
      aria-hidden="true"
      focusable="false"
      size={width}
      style={{
        width,
        height,
        flexShrink: 0,
          color:
            name === "notification"
              ? "#f87171"
              : "var(--sidebar-icon-color, inherit)",
      }}
      fill={name === "notification" ? "currentColor" : "none"}
    />
  );
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [notice, setNotice] = useState<{ id: number; message: string } | null>(
    null,
  );
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const navigationId = useId();
  const accountPopoverId = useId();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuthStore();
  const { photo } = useProfilePhoto(user?.id);
  const activeAlertsCount = useAlertStore((state) =>
    state.alerts.filter((a) => a.status === "active").length
  );

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  function closeAccountMenu() {
    accountMenuRef.current?.hidePopover();
    accountButtonRef.current?.focus();
  }

  function showUnavailableFeature(feature: string) {
    closeAccountMenu();
    setNotice({
      id: Date.now(),
      message: `Feature ${feature} is currently unavailable.`,
    });
  }

  function handleAccountMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not(:disabled)',
      ),
    );
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) %
            items.length;
    items[next]?.focus();
  }

  function renderMenuItem(item: MenuItem) {
    if (item.adminOnly && !isAdmin(user)) return null;

    const isActive =
      item.href === "/"
        ? pathname === "/"
        : pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-label={item.label}
          aria-current={isActive ? "page" : undefined}
          title={!isOpen ? item.label : undefined}
          className={`${styles.navItem} relative flex h-[35px] items-center gap-1 rounded-[5px] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffcc00] ${
            isOpen ? "w-[157px] pr-3" : "w-[35px]"
          }`}
        >
          <span
            className="relative flex h-[33.34px] w-[33.34px] shrink-0 items-center justify-center"
            aria-hidden="true"
          >
            <SidebarIcon {...item.icon} />
            {item.badge && activeAlertsCount > 0 && !isOpen && (
              <span className="absolute top-0 left-[24px]">
                <SidebarIcon name="notification" width={6} height={6} />
              </span>
            )}
          </span>
          {isOpen && (
            <span className="truncate text-[14.478px] font-bold tracking-[0.0724px]">
              {item.label}
            </span>
          )}
          {item.badge && activeAlertsCount > 0 && isOpen && (
            <span
              className="absolute top-[14px] left-[137px]"
              aria-hidden="true"
            >
              <SidebarIcon name="notification" width={6} height={6} />
            </span>
          )}
        </Link>
      </li>
    );
  }

  return (
    <aside
      aria-label="Sidebar navigation"
      data-expanded={isOpen}
      className={`${styles.sidebar} relative z-20 flex h-dvh shrink-0 flex-col bg-[#0a3f5c] transition-[width] duration-300 ease-out motion-reduce:transition-none`}
    >
      <div
        className={`flex h-[74px] shrink-0 items-start gap-[9px] overflow-hidden pt-4 ${isOpen ? "pl-4" : "pl-[17px]"}`}
      >
        <Link
          href="/"
          aria-label="RSA UGM — Dashboard"
          className="shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffcc00]"
        >
          <Image
            src="/images/sidebar/ugm-logo.png"
            alt="UGM emblem"
            width={42}
            height={44}
            unoptimized
            className="h-[44px] w-[42px] object-cover"
          />
        </Link>
        {isOpen && (
          <div className="flex h-[44px] flex-col justify-center whitespace-nowrap text-white">
            <p className="text-base font-bold">RSA UGM</p>
            <p className="text-xs text-[#f3f1f1]">SI-POTA v1.0</p>
          </div>
        )}
      </div>

      <div
        className={`${isOpen ? "ml-[28px]" : "ml-[23px]"} shrink-0`}
        aria-hidden="true"
      >
        <SidebarIcon
          name={isOpen ? "expanded-divider" : "divider"}
          width={isOpen ? 144 : 28}
          height={0.5}
        />
      </div>

      <div
        className={`flex ${isOpen ? "h-[39.5px]" : "h-[37.5px]"} shrink-0 items-center pl-[19px]`}
      >
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={isOpen}
          aria-controls={navigationId}
          title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          className={`${styles.navItem} relative flex h-[35px] w-[35px] cursor-pointer items-center justify-center rounded-[5px] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffcc00]`}
        >
          <SidebarCollapseIcon isOpen={isOpen} />
        </button>
      </div>

      <nav
        id={navigationId}
        aria-label="Main menu"
        className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto ${isOpen ? "pr-[13px] pl-[21px]" : "px-[19px]"}`}
      >
        <ul className={isOpen ? "pb-[6px]" : "pb-[7px]"}>
          {renderMenuItem(DASHBOARD)}
        </ul>
        {MENU_GROUPS.map((group, index) => (
          <div key={group[0].href}>
            <div
              className={
                isOpen
                  ? index === 0
                    ? "ml-[7px]"
                    : "ml-[5px]"
                  : index === 0
                    ? "ml-[3px]"
                    : "ml-[2px]"
              }
              aria-hidden="true"
            >
              <SidebarIcon
                name={
                  isOpen
                    ? "expanded-divider"
                    : index === 0
                      ? "divider"
                      : "group-divider"
                }
                width={isOpen ? 144 : 28}
                height={0.5}
              />
            </div>
            <ul className="flex flex-col gap-[10px] pt-[9.5px] pb-[10px]">
              {group.map(renderMenuItem)}
            </ul>
          </div>
        ))}
      </nav>

      <div
        className={`shrink-0 pt-4 pb-[39px] ${isOpen ? "pl-[21px]" : "pl-[22px]"}`}
      >
        <button
          ref={accountButtonRef}
          type="button"
          popoverTarget={accountPopoverId}
          aria-label="Open account menu"
          aria-haspopup="menu"
          title={user ? `Account ${user.username}` : "Account menu"}
          className={`flex min-h-8 cursor-pointer items-center gap-[11px] rounded-full text-left text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffcc00] ${isOpen ? "w-[150px]" : "w-8"}`}
        >
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/25 bg-white/15 text-white/75"
          >
            {photo ? <Image src={photo} alt="" width={32} height={32} unoptimized className="h-full w-full object-cover" /> : <LuUserRound size={17} />}
          </span>
          {isOpen && user && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-bold tracking-wide text-white">
                {user.username}
              </span>
              <span className="block text-[11px] font-normal tracking-wide text-[#8eaec2]">
                {ROLE_LABELS[user.role] || user.role}
              </span>
            </span>
          )}
          {isOpen && (
            <span
              className={`ml-auto flex size-6 shrink-0 items-center justify-center transition-transform duration-200 ease-out ${
                isAccountOpen ? "rotate-180" : "rotate-0"
              }`}
              aria-hidden="true"
            >
              <SidebarIcon name="account-chevron" width={15} height={15} />
            </span>
          )}
        </button>
        <div
          ref={accountMenuRef}
          id={accountPopoverId}
          popover="auto"
          aria-label="Account menu"
          role="menu"
          onKeyDown={handleAccountMenuKeyDown}
          onToggle={(event) => {
            const open = event.newState === "open";
            setIsAccountOpen(open);
            if (open) {
              accountMenuRef.current
                ?.querySelector<HTMLElement>('[role="menuitem"]')
                ?.focus({ preventScroll: true });
            }
          }}
          className={styles.accountMenu}
        >
          <Link
            href="/"
            role="menuitem"
            onClick={closeAccountMenu}
            className={styles.accountItem}
          >
            <SidebarIcon name="account-control-panel" width={24} height={24} />
            <span className="min-w-0 flex-1">Control panel</span>
            <SidebarIcon name="account-control-arrow" width={20} height={20} />
          </Link>
          <Link
            href="/profile"
            role="menuitem"
            onClick={closeAccountMenu}
            className={styles.accountItem}
          >
            <SidebarIcon name="account-profile" width={24} height={24} />
            <span className="min-w-0 flex-1">View Profile</span>
            <SidebarIcon name="account-profile-arrow" width={20} height={20} />
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => showUnavailableFeature("Change Password")}
            className={`${styles.accountItem} ${styles.passwordItem}`}
          >
            <span
              className={styles.passwordIcon}
              aria-hidden="true"
            >
              <SidebarIcon
                name="account-password"
                width={16}
                height={17.7778}
              />
            </span>
            <span className="min-w-0 flex-1 whitespace-nowrap">
              Change Password
            </span>
            <SidebarIcon name="account-password-arrow" width={20} height={20} />
          </button>
          <div className={styles.logoutSection} role="none">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={isLoading}
              className={`${styles.accountItem} ${styles.logoutItem}`}
            >
              {isLoading ? (
                <Loader2
                  aria-hidden="true"
                  className="size-6 shrink-0 animate-spin"
                />
              ) : (
                <SidebarIcon name="account-logout" width={24} height={24} />
              )}
              <span className="min-w-0 flex-1">Log Out</span>
              <SidebarIcon name="account-logout-arrow" width={20} height={20} />
            </button>
          </div>
        </div>
      </div>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="fixed right-4 bottom-4 z-50 max-w-[min(360px,calc(100vw-32px))]"
      >
        {notice && (
          <div
            key={notice.id}
            className="flex items-start gap-3 rounded-xl border border-sky-200 bg-white p-4 text-sm text-[#0a3f5c] shadow-lg"
          >
            <Info
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-[#0077b6]"
            />
            <p>{notice.message}</p>
            <button
              type="button"
              aria-label="Close notification"
              onClick={() => setNotice(null)}
              className="shrink-0 rounded p-1 hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-[#0077b6]"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
