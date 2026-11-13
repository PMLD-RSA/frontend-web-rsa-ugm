"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LuArrowUpRight as ArrowUpRight,
  LuBell as Bell,
  LuDatabase as Database,
  LuDownload as Download,
  LuDroplets as Droplets,
  LuMapPin as MapPin,
  LuPlus as Plus,
  LuRefreshCw as RefreshCw,
  LuSearch as Search,
  LuSlidersHorizontal as SlidersHorizontal,
  LuTrash2 as Trash2,
} from "react-icons/lu";
import { TankLevel, measurement } from "@/components/dashboard/TankLevel";
import { downloadCsv } from "@/lib/downloadCsv";
import { getTankStatus } from "@/lib/dashboard";
import type { ApiResponse, Tank } from "@/types";
import styles from "./TanksPage.module.css";
import { TankForm } from "./TankForm";
import { AddTankForm } from "./AddTankForm";
import { DeleteTankDialog } from "./DeleteTankDialog";
import { isAdmin, useAuthStore } from "@/stores/authStore";

const summaries = [
  { key: "ALL", title: "Total Tanks", description: "Registered in the System" },
  { key: "NORMAL", title: "Normal", description: "Water Level Normal" },
  { key: "WARNING", title: "Warning", description: "Requires Monitoring" },
  { key: "CRITICAL", title: "Critical", description: "Requires Attention" },
] as const;

export function TanksPage() {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [form, setForm] = useState<{ tank: Tank | null } | null>(null);
  const [deletingTank, setDeletingTank] = useState<Tank | null>(null);
  const canEdit = useAuthStore((state) => isAdmin(state.user));
  const [updated, setUpdated] = useState<Date | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/tanks", { signal });
      const result: ApiResponse<Tank[]> = await response.json();
      if (
        !response.ok ||
        !result.success ||
        result.source === "mock" ||
        !Array.isArray(result.data)
      )
        throw new Error("Unavailable");
      setTanks(result.data);
      setUpdated(new Date());
      setState("ready");
    } catch {
      if (!signal?.aborted) {
        setTanks([]);
        setState("error");
      }
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal));
    return () => controller.abort();
  }, [load]);

  const visible = tanks.filter(
    (tank) =>
      (filter === "ALL" || getTankStatus(tank) === filter) &&
      `${tank.name} ${tank.location ?? ""}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  function download() {
    const rows = [
      ["Name", "Location", "Status", "Level (%)", "Volume (L)", "Capacity (L)"],
      ...tanks.map((t) => [
        t.name,
        t.location ?? "",
        getTankStatus(t) ?? "No data",
        t.latestReading?.levelPercent ?? "",
        t.latestReading?.volumeLiters ?? "",
        t.capacityLiters,
      ]),
    ];
    downloadCsv("tanks.csv", rows);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Tanks</h1>
        <div>
          <Link
            href="/alerts"
            className={styles.notification}
            aria-label="Alerts"
          >
            <Bell size={23} />
          </Link>
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
      <div className={styles.breadcrumb}>
        <span>
          <Link href="/">Dashboard</Link> &gt; Tanks
        </span>
        <span>
          {updated &&
            `Updated ${updated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} · `}
          <button
            onClick={() => {
              setState("loading");
              void load();
            }}
          >
            <RefreshCw size={13} /> Reload
          </button>
        </span>
      </div>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Search size={20} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
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
          title={!canEdit ? "Hanya admin dapat menambahkan tangki" : undefined}
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
                  {state === "ready"
                    ? item.key === "ALL"
                      ? tanks.length
                      : tanks.filter((t) => getTankStatus(t) === item.key)
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
      {state === "loading" ? (
        <p className={styles.message}>Loading tanks…</p>
      ) : state === "error" ? (
        <p className={styles.message}>
          Tank data is unavailable. Please try reloading.
        </p>
      ) : !visible.length ? (
        <p className={styles.message}>No tanks found.</p>
      ) : (
        <section className={styles.cards} aria-label="Tanks">
          {visible.map((tank) => {
            const status = getTankStatus(tank) ?? "UNKNOWN";
            return (
              <article key={tank.id} className={styles.card}>
                <TankLevel tank={tank} />
                <div className={styles.cardInfo}>
                  <span className={styles.badge} data-status={status}>
                    <i />
                    {status === "UNKNOWN" ? "NO DATA" : status}
                  </span>
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
                        {measurement(tank.latestReading?.volumeLiters, " L")}{" "}
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
                          ? "Hanya admin dapat mengedit tangki"
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
                          ? "Hanya admin dapat menghapus tangki"
                          : "Hapus tangki"
                      }
                      aria-label={`Hapus ${tank.name}`}
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
              void load();
            }}
          />
        ) : (
          <AddTankForm
            close={() => setForm(null)}
            saved={() => {
              setForm(null);
              void load();
            }}
          />
        ))}
      {deletingTank && (
        <DeleteTankDialog
          tank={deletingTank}
          close={() => setDeletingTank(null)}
          deleted={() => {
            setTanks((current) =>
              current.filter((tank) => tank.id !== deletingTank.id),
            );
            setDeletingTank(null);
          }}
        />
      )}
    </div>
  );
}
