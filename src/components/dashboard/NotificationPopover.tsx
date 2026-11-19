'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  LuBell as Bell,
  LuTriangleAlert as AlertTriangle,
  LuCircleAlert as AlertCircle,
  LuCheck as Check,
  LuX as CloseIcon,
  LuArrowRight,
} from 'react-icons/lu';
import { useAlertStore } from '@/stores/alertStore';

function formatAlertSummary(message: string, level: string): string {
  // Extract specific detail after "WARNING:" or "CRITICAL:"
  const regex = new RegExp(`(?:${level}|WARNING|CRITICAL):\\s*(.+)$`, 'i');
  const match = message.match(regex);
  if (match && match[1]) {
    return `Level air ${match[1].trim()}`;
  }
  // Clean up duplicate "tangki Tangki" phrasing if present
  return message.replace(/tangki\s+tangki/gi, 'Tangki');
}

export function NotificationPopover({
  className,
  iconSize = 22,
}: {
  className?: string;
  iconSize?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const alerts = useAlertStore((state) => state.alerts);
  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const count = activeAlerts.length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        className={className}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifikasi peringatan (${count} aktif)`}
        aria-expanded={isOpen}
        title="Lihat notifikasi peringatan"
      >
        <span className="relative inline-flex items-center justify-center">
          <Bell size={iconSize} />
          {count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ef4444] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Daftar Notifikasi Peringatan"
          className="absolute right-0 top-full mt-2.5 w-[320px] sm:w-[410px] bg-white border border-slate-200/90 rounded-2xl shadow-2xl shadow-slate-900/10 z-50 overflow-hidden text-slate-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="font-semibold text-sm text-slate-800">
                Notifikasi Peringatan
              </span>
              {count > 0 ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                  {count} Aktif
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Aman
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Tutup notifikasi"
            >
              <CloseIcon size={16} />
            </button>
          </div>

          {/* List of active alerts */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100">
            {activeAlerts.length > 0 ? (
              activeAlerts.slice(0, 5).map((a) => {
                const isCritical = a.level === 'CRITICAL';
                return (
                  <div
                    key={a.id}
                    className="px-5 py-3.5 hover:bg-slate-50/70 transition-colors flex items-start gap-3.5 text-left"
                  >
                    <div
                      className={`size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isCritical
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}
                    >
                      {isCritical ? <AlertCircle size={17} /> : <AlertTriangle size={17} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[13px] text-slate-900 truncate">
                          {a.tankName || `Tangki ${a.tankId}`}
                        </span>
                        <span
                          className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isCritical
                              ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                              : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                          }`}
                        >
                          {a.level}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">
                        {formatAlertSummary(a.message, a.level)}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5">
                        <span className="inline-block size-1.5 rounded-full bg-slate-300" />
                        <span>
                          {new Date(a.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          WIB
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-10 text-center text-slate-500">
                <div className="size-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5">
                  <Check size={20} />
                </div>
                <p className="text-xs font-semibold text-slate-700">Tidak ada peringatan aktif</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-[220px] mx-auto">
                  Semua tangki air berada dalam parameter normal.
                </p>
              </div>
            )}
          </div>

          {/* Footer - Single clean action */}
          <div className="p-3 bg-slate-50/70 border-t border-slate-100 text-center">
            <Link
              href="/alerts"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#0077b6] hover:text-[#0a3f5c] py-0.5 transition-colors"
            >
              <span>{count > 0 ? `Lihat Semua di Alarm & Events` : `Buka Alarm & Events`}</span>
              <LuArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
