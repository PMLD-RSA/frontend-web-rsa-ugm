'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Info, Loader2, X } from 'lucide-react';
import { useAuthStore, isAdmin } from '@/stores/authStore';
import styles from './Sidebar.module.css';

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
  icon: { name: 'dashboard', width: 16.34, height: 16.34 },
  label: 'Dashboard',
  href: '/',
};

const MENU_GROUPS: MenuItem[][] = [
  [
    { icon: { name: 'tanks', width: 18, height: 18 }, label: 'Tangki', href: '/tanks' },
    { icon: { name: 'reports', width: 18, height: 24 }, label: 'Laporan', href: '/reports' },
    { icon: { name: 'alerts', width: 18, height: 20 }, label: 'Peringatan', href: '/alerts', badge: true },
  ],
  [
    { icon: { name: 'logs', width: 17.5245, height: 21.6019 }, label: 'Audit Log', href: '/logs' },
    { icon: { name: 'users', width: 20, height: 16 }, label: 'Pengguna', href: '/users', adminOnly: true },
    { icon: { name: 'devices', width: 18.84, height: 18.84 }, label: 'Perangkat', href: '/devices' },
  ],
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  operator: 'Operator',
  viewer: 'Viewer',
};

// Keep the exported SVGs at their original dimensions from Figma.
function SidebarIcon({ name, width, height }: SidebarAsset) {
  return (
    <Image
      src={`/images/sidebar/${name}.svg`}
      alt=""
      width={width}
      height={height}
      unoptimized
      draggable={false}
      style={{ width, height }}
      className="shrink-0"
    />
  );
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [notice, setNotice] = useState<{ id: number; message: string } | null>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const navigationId = useId();
  const accountPopoverId = useId();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuthStore();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  function closeAccountMenu() {
    accountMenuRef.current?.hidePopover();
    accountButtonRef.current?.focus();
  }

  function showUnavailableFeature(feature: string) {
    closeAccountMenu();
    setNotice({ id: Date.now(), message: `Fitur ${feature} belum terintegrasi dan belum dapat digunakan.` });
  }

  function handleAccountMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)'));
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
      : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  }

  function renderMenuItem(item: MenuItem) {
    if (item.adminOnly && !isAdmin(user)) return null;

    const isActive = item.href === '/'
      ? pathname === '/'
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-label={item.label}
          aria-current={isActive ? 'page' : undefined}
          title={!isOpen ? item.label : undefined}
          className={`${styles.navItem} relative flex h-[35px] items-center gap-1 rounded-[5px] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffcc00] ${
            isOpen ? 'w-[157px] pr-3' : 'w-[35px]'
          }`}
        >
          <span className="relative flex h-[33.34px] w-[33.34px] shrink-0 items-center justify-center" aria-hidden="true">
            <SidebarIcon {...item.icon} />
            {item.badge && !isOpen && (
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
          {item.badge && isOpen && (
            <span className="absolute top-[14px] left-[137px]" aria-hidden="true">
              <SidebarIcon name="notification" width={6} height={6} />
            </span>
          )}
        </Link>
      </li>
    );
  }

  return (
    <aside
      aria-label="Sidebar navigasi"
      data-expanded={isOpen}
      className={`${styles.sidebar} relative z-20 flex h-dvh shrink-0 flex-col bg-[#0a3f5c] transition-[width] duration-300 ease-out motion-reduce:transition-none`}
    >
      <div className={`flex h-[74px] shrink-0 items-start gap-[9px] overflow-hidden pt-4 ${isOpen ? 'pl-4' : 'pl-[17px]'}`}>
        <Link href="/" aria-label="RSA UGM — Dashboard" className="shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffcc00]">
          <Image
            src="/images/sidebar/ugm-logo.png"
            alt="Lambang UGM"
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

      <div className={`${isOpen ? 'ml-[28px]' : 'ml-[23px]'} shrink-0`} aria-hidden="true">
        <SidebarIcon name={isOpen ? 'expanded-divider' : 'divider'} width={isOpen ? 144 : 28} height={0.5} />
      </div>

      <div className={`flex ${isOpen ? 'h-[39.5px]' : 'h-[37.5px]'} shrink-0 items-center pl-[19px]`}>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={isOpen ? 'Ciutkan sidebar' : 'Perluas sidebar'}
          aria-expanded={isOpen}
          aria-controls={navigationId}
          title={isOpen ? 'Ciutkan sidebar' : 'Perluas sidebar'}
          className={`${styles.navItem} relative flex h-[35px] w-[35px] cursor-pointer items-center justify-center rounded-[5px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffcc00]`}
        >
          {isOpen ? (
            <span className="translate-x-[1.5px] translate-y-[1.375px] rotate-180" aria-hidden="true">
              <SidebarIcon name="expanded-toggle" width={20} height={11.2538} />
            </span>
          ) : (
          <span className="relative block h-[12px] w-[20px] translate-x-[2.5px] translate-y-[2.75px]" aria-hidden="true">
            <span className="absolute top-0 left-0"><SidebarIcon name="toggle-line" width={10} height={1} /></span>
            <span className="absolute top-[10px] left-0"><SidebarIcon name="toggle-line" width={10} height={1} /></span>
            <span className="absolute top-[0.2px] left-0"><SidebarIcon name="toggle-arrow" width={19.8349} height={10.9433} /></span>
          </span>
          )}
        </button>
      </div>

      <nav id={navigationId} aria-label="Menu utama" className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto ${isOpen ? 'pr-[13px] pl-[21px]' : 'px-[19px]'}`}>
        <ul className={isOpen ? 'pb-[6px]' : 'pb-[7px]'}>{renderMenuItem(DASHBOARD)}</ul>
        {MENU_GROUPS.map((group, index) => (
          <div key={group[0].href}>
            <div className={isOpen ? (index === 0 ? 'ml-[7px]' : 'ml-[5px]') : (index === 0 ? 'ml-[3px]' : 'ml-[2px]')} aria-hidden="true">
              <SidebarIcon name={isOpen ? 'expanded-divider' : index === 0 ? 'divider' : 'group-divider'} width={isOpen ? 144 : 28} height={0.5} />
            </div>
            <ul className="flex flex-col gap-[10px] pt-[9.5px] pb-[10px]">
              {group.map(renderMenuItem)}
            </ul>
          </div>
        ))}
      </nav>

      <div className={`shrink-0 pt-4 pb-[39px] ${isOpen ? 'pl-[21px]' : 'pl-[22px]'}`}>
        <button
          ref={accountButtonRef}
          type="button"
          popoverTarget={accountPopoverId}
          aria-label="Buka menu akun"
          aria-haspopup="menu"
          title={user ? `Akun ${user.username}` : 'Menu akun'}
          className={`flex min-h-8 cursor-pointer items-center gap-[11px] rounded-full text-left text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffcc00] ${isOpen ? 'w-[150px]' : 'w-8'}`}
        >
          {/* Empty avatar reserved for the user's future profile photo upload. */}
          <span aria-hidden="true" className="block size-8 shrink-0 rounded-full border border-white/25 bg-white/10" />
          {isOpen && user && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[10.231px] font-bold tracking-[0.0512px]">{user.username}</span>
              <span className="block text-[7.23px] tracking-[0.0362px]">{ROLE_LABELS[user.role] || user.role}</span>
            </span>
          )}
          {isOpen && (
            <span className="ml-auto flex size-5 shrink-0 -scale-x-100 items-center justify-center" aria-hidden="true">
              <SidebarIcon name="account-chevron" width={12} height={12} />
            </span>
          )}
        </button>
        <div
          ref={accountMenuRef}
          id={accountPopoverId}
          popover="auto"
          aria-label="Menu akun"
          role="menu"
          onKeyDown={handleAccountMenuKeyDown}
          onToggle={(event) => {
            if (event.newState === 'open') {
              accountMenuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true });
            }
          }}
          className={styles.accountMenu}
        >
          <Link href="/" role="menuitem" onClick={closeAccountMenu} className={styles.accountItem}>
            <SidebarIcon name="account-control-panel" width={24} height={24} />
            <span className="min-w-0 flex-1">Control panel</span>
            <SidebarIcon name="account-control-arrow" width={20} height={20} />
          </Link>
          <button type="button" role="menuitem" onClick={() => showUnavailableFeature('View Profile')} className={`${styles.accountItem} ${styles.profileItem}`}>
            <SidebarIcon name="account-profile" width={24} height={24} />
            <span className="min-w-0 flex-1">View Profile</span>
            <SidebarIcon name="account-profile-arrow" width={20} height={20} />
          </button>
          <button type="button" role="menuitem" onClick={() => showUnavailableFeature('Change Password')} className={`${styles.accountItem} ${styles.passwordItem}`}>
            <span className="flex w-[14.222px] shrink-0 items-center justify-center" aria-hidden="true">
              <SidebarIcon name="account-password" width={16} height={17.7778} />
            </span>
            <span className="min-w-0 flex-1 whitespace-nowrap">Change Password</span>
            <SidebarIcon name="account-password-arrow" width={20} height={20} />
          </button>
          <div className={styles.logoutSection} role="none">
            <span className={styles.logoutDivider} aria-hidden="true"><SidebarIcon name="account-divider" width={228.5} height={0.50002} /></span>
            <span className={styles.logoutDivider} aria-hidden="true"><SidebarIcon name="account-divider" width={228.5} height={0.50002} /></span>
            <button type="button" role="menuitem" onClick={handleLogout} disabled={isLoading} className={`${styles.accountItem} ${styles.logoutItem}`}>
              {isLoading ? <Loader2 aria-hidden="true" className="size-6 shrink-0 animate-spin" /> : <SidebarIcon name="account-logout" width={24} height={24} />}
              <span className="min-w-0 flex-1">Log Out</span>
              <SidebarIcon name="account-logout-arrow" width={20} height={20} />
            </button>
          </div>
        </div>
      </div>
      <div role="status" aria-live="polite" aria-atomic="true" className="fixed right-4 bottom-4 z-50 max-w-[min(360px,calc(100vw-32px))]">
        {notice && (
          <div key={notice.id} className="flex items-start gap-3 rounded-xl border border-sky-200 bg-white p-4 text-sm text-[#0a3f5c] shadow-lg">
            <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#0077b6]" />
            <p>{notice.message}</p>
            <button type="button" aria-label="Tutup pemberitahuan" onClick={() => setNotice(null)} className="shrink-0 rounded p-1 hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-[#0077b6]">
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
