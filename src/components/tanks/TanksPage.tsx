"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LuArrowUpRight as ArrowUpRight,
  LuDatabase as Database,
  LuDownload as Download,
  LuDroplets as Droplets,
  LuMapPin as MapPin,
  LuPlus as Plus,
  LuRefreshCw as RefreshCw,
  LuSettings as BreadcrumbIcon,
  LuSearch as Search,
  LuSlidersHorizontal as SlidersHorizontal,
  LuTrash2 as Trash2,
  LuWifi as Wifi,
  LuWifiOff as WifiOff,
} from "react-icons/lu";
import { TankLevel, measurement } from "@/components/dashboard/TankLevel";
import { downloadCsv } from "@/lib/downloadCsv";
import { getTankStatus } from "@/lib/dashboard";
import { getTankMonitoring } from "@/lib/devicePresence";
import type { Tank } from "@/types";
import styles from "./TanksPage.module.css";
import { TankForm } from "./TankForm";
import { AddTankForm } from "./AddTankForm";
import { DeleteTankDialog } from "./DeleteTankDialog";
import { NotificationPopover } from "@/components/dashboard/NotificationPopover";
import { isAdmin, useAuthStore } from "@/stores/authStore";
import { useTankStore } from "@/stores/tankStore";

const summaries = [
  { key: "ALL", title: "Total Tanks", description: "Registered in the System" },
  { key: "NORMAL", title: "Normal", description: "Water Level Normal" },
  { key: "WARNING", title: "Warning", description: "Requires Monitoring" },
  { key: "CRITICAL", title: "Critical", description: "Requires Attention" },
] as const;

export function TanksPage() {
  const { tanks, isLoading, error, lastFetchedAt, fetchTanks } = useTankStore();
  const [now, setNow] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [form, setForm] = useState<{ tank: Tank | null } | null>(null);
  const [deletingTank, setDeletingTank] = useState<Tank | null>(null);
  const canEdit = useAuthStore((state) => isAdmin(state.user));
  useEffect(() => {
    const controller = new AbortController();
    const updateClock = () => setNow(Date.now());
    const initialClock = setTimeout(updateClock, 0);
    const clock = setInterval(updateClock, 5000);
    let refresh: ReturnType<typeof setTimeout>;

    async function refreshTanks(background: boolean) {
      await fetchTanks(controller.signal, background);
      if (!controller.signal.aborted) {
        refresh = setTimeout(() => void refreshTanks(true), 15_000);
      }
    }
    void refreshTanks(false);
    return () => {
      controller.abort();
      clearTimeout(initialClock);
      clearInterval(clock);
      clearTimeout(refresh);
    };
  }, [fetchTanks]);

  const loading = !lastFetchedAt && !error;
  const rows = tanks.map(tank => {
    const monitoring = getTankMonitoring(tank, Math.max(now, lastFetchedAt ?? 0));
    const liveTank = {
      ...tank,
      latestReading: monitoring.liveReading,
      activeAlert: monitoring.liveReading ? tank.activeAlert : null,
    };
    return { tank, liveTank, ...monitoring, status: getTankStatus(liveTank) };
  });
  const visible = rows.filter(
    ({ tank, status }) =>
      (filter === "ALL" || status === filter) &&
      `${tank.name} ${tank.location ?? ""}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  function download() {
    const csvRows = [
      ["Name", "Location", "Status", "Level (%)", "Volume (L)", "Capacity (L)"],
      ...rows.map(({ tank, liveReading, status, sensorLabel }) => [
        tank.name,
        tank.location ?? "",
        status ?? sensorLabel,
        liveReading?.levelPercent ?? "",
        liveReading?.volumeLiters ?? "",
        tank.capacityLiters,
      ]),
    ];
    downloadCsv("tanks.csv", csvRows);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Tanks</h1>
        <div>
          <NotificationPopover
            className={styles.notification}
            iconSize={23}
          />
          <button
            className={styles.download}
            onClick={download}
            disabled={!tanks.length}
          >
            <Download size={20} />
            Download All
          </button>
        </div>
      </header>
      <div className={`${styles.breadcrumb} app-breadcrumb`}>
        <span>
          <BreadcrumbIcon size={16} aria-hidden="true" /><Link href="/">Dashboard</Link> &gt; Tanks
        </span>
        <span>
          {lastFetchedAt &&
            `Synced ${new Date(lastFetchedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} · `}
          <button
            disabled={isLoading}
            onClick={() => void fetchTanks()}
          >
            <RefreshCw size={13} /> Reload
          </button>
        </span>
      </div>
      <div className={styles.toolbar}>
        <label className="app-search">
          <Search size={16} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tanks..."
            aria-label="Search tanks"
          />
        </label>
        <label className={styles.filter}>
          <SlidersHorizontal size={19} />
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="ALL">Filter</option>
            <option value="NORMAL">Normal</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </label>
        <button
          className={styles.add}
          disabled={!canEdit}
          title={!canEdit ? "Only administrators can add tanks" : undefined}
          onClick={() => setForm({ tank: null })}
        >
          <Plus size={20} />
          Add New Tanks
        </button>
      </div>
      <section className={styles.summaries} aria-label="Tank status summary">
        {summaries.map((item) => (
          <div key={item.key} className={styles.summary} data-status={item.key}>
            <div>
              <h2>{item.title}</h2>
              <p>
                <strong>
                  {!loading && !error
                    ? item.key === "ALL"
                      ? tanks.length
                      : rows.filter((row) => row.status === item.key)
                          .length
                    : "—"}
                </strong>{" "}
                Tanks
              </p>
            </div>
            {item.key === "ALL" ? (
              <Image
                className={styles.totalIcon}
                src="/images/tanks/vector.svg"
                alt=""
                width={81}
                height={63}
                unoptimized
              />
            ) : (
              <Image
                className={styles.statusIcon}
                src={`/images/tanks/${item.key.toLowerCase()}.png`}
                alt=""
                width={108}
                height={106}
                unoptimized
              />
            )}
            <small>
              {item.key !== "ALL" && <i />}
              {item.description}
            </small>
          </div>
        ))}
      </section>
      {loading ? (
        <p className={styles.message}>Loading tanks…</p>
      ) : error ? (
        <p className={styles.message}>
          Tank data is unavailable. Please try reloading.
        </p>
      ) : !visible.length ? (
        <p className={styles.message}>No tanks found.</p>
      ) : (
        <section className={styles.cards} aria-label="Tanks">
          {visible.map(({ tank, liveTank, liveReading, status, sensorLabel, online }) => {
            return (
              <article key={tank.id} className={styles.card}>
                <TankLevel tank={liveTank} />
                <div className={styles.cardInfo}>
                  <div className={styles.statuses}>
                    <span className={styles.badge} data-status={status ?? "UNKNOWN"}>
                      <i />
                      {status ?? "NO DATA"}
                    </span>
                    <span className={styles.sensorStatus} data-online={online} role="status">
                      {online ? <Wifi size={16} aria-hidden="true" /> : <WifiOff size={16} aria-hidden="true" />}
                      {sensorLabel}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.icon}>
                      <Droplets size={25} />
                    </span>
                    <div>
                      <h2>{tank.name}</h2>
                      <p>
                        <MapPin size={17} />
                        {tank.location || "Location unavailable"}
                      </p>
                    </div>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.icon}>
                      <Database size={25} />
                    </span>
                    <div>
                      <p>Volume</p>
                      <strong>
                        {measurement(liveReading?.volumeLiters, " L")}{" "}
                        <span>/ {measurement(tank.capacityLiters, " L")}</span>
                      </strong>
                    </div>
                  </div>
                  <div className={styles.cardActions}>
                    <Link
                      className={styles.details}
                      href={"/tanks/" + encodeURIComponent(tank.id)}
                    >
                      View Details <ArrowUpRight size={20} />
                    </Link>
                    <button
                      className={styles.edit}
                      disabled={!canEdit}
                      title={
                        !canEdit
                          ? "Only administrators can edit tanks"
                          : undefined
                      }
                      onClick={() => setForm({ tank })}
                    >
                      Edit <ArrowUpRight size={20} />
                    </button>
                    <button
                      className={styles.delete}
                      disabled={!canEdit}
                      title={
                        !canEdit
                          ? "Only administrators can delete tanks"
                          : "Delete tank"
                      }
                      aria-label={`Delete ${tank.name}`}
                      onClick={() => setDeletingTank(tank)}
                    >
                      <Trash2 size={19} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
      {form &&
        (form.tank ? (
          <TankForm
            tank={form.tank}
            close={() => setForm(null)}
            saved={() => {
              setForm(null);
              void fetchTanks();
            }}
          />
        ) : (
          <AddTankForm
            close={() => setForm(null)}
            saved={() => {
              setForm(null);
              void fetchTanks();
            }}
          />
        ))}
      {deletingTank && (
        <DeleteTankDialog
          tank={deletingTank}
          close={() => setDeletingTank(null)}
          deleted={() => {
            setDeletingTank(null);
            void fetchTanks();
          }}
        />
      )}
    </div>
  );
}
