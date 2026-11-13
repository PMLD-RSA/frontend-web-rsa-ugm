"use client";

import { LuX } from "react-icons/lu";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ApiResponse, AuditLog, Tank } from "@/types";
import styles from "./TankForm.module.css";
import editStyles from "./EditTankForm.module.css";
import confirmStyles from "./ConfirmTankEdit.module.css";

type TankUpdate = {
  name: string;
  location: string;
  capacityLiters: number;
  minThresholdPercent: number;
  maxThresholdPercent: number;
};

export function TankForm({
  tank,
  close,
  saved,
}: {
  tank: Tank;
  close: () => void;
  saved: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(tank.name);
  const [location, setLocation] = useState(tank.location ?? "");
  const [capacity, setCapacity] = useState(String(tank.capacityLiters));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<TankUpdate | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<AuditLog[]>([]);
  const [historyState, setHistoryState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyHasNext, setHistoryHasNext] = useState(false);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  async function loadHistory(page: number) {
    setHistoryState("loading");
    try {
      const response = await fetch(
        `/api/audit-logs?entity=tanks&limit=100&page=${page}`,
      );
      const result: ApiResponse<AuditLog[]> & { total?: number } =
        await response.json();
      if (
        !response.ok ||
        !result.success ||
        result.source === "mock" ||
        !Array.isArray(result.data)
      )
        throw new Error();
      setHistory(result.data.filter((log) => log.entityId === tank.id));
      setHistoryHasNext(
        typeof result.total === "number"
          ? page * 100 < result.total
          : result.data.length === 100,
      );
      setHistoryPage(page);
      setHistoryState("ready");
    } catch {
      setHistoryState("error");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const capacityLiters = Number(capacity);
    const minThresholdPercent = Number(data.get("minThresholdPercent"));
    const maxThresholdPercent = Number(data.get("maxThresholdPercent"));
    if (
      !name.trim() ||
      !Number.isFinite(capacityLiters) ||
      capacityLiters <= 0 ||
      !Number.isFinite(minThresholdPercent) ||
      !Number.isFinite(maxThresholdPercent) ||
      minThresholdPercent < 0 ||
      maxThresholdPercent > 100 ||
      minThresholdPercent >= maxThresholdPercent
    ) {
      setError(
        "Periksa nama, kapasitas, dan batas minimum serta maksimum toren.",
      );
      return;
    }
    setError("");
    setPending({
      name: name.trim(),
      location: location.trim(),
      capacityLiters,
      minThresholdPercent,
      maxThresholdPercent,
    });
  }

  async function confirmSave() {
    if (!pending || saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        `/api/tanks/${encodeURIComponent(tank.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pending),
        },
      );
      const result: ApiResponse = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message || "Data toren gagal disimpan.");
      saved();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Data toren gagal disimpan.",
      );
      setSaving(false);
    }
  }

  const changedFields = pending
    ? [
        pending.name !== tank.name && "nama",
        pending.location !== (tank.location ?? "") && "gedung",
        pending.capacityLiters !== Number(tank.capacityLiters) && "kapasitas",
        pending.minThresholdPercent !== Number(tank.minThresholdPercent) &&
          "batas minimum",
        pending.maxThresholdPercent !== Number(tank.maxThresholdPercent) &&
          "batas maksimum",
      ].filter(Boolean)
    : [];

  return (
    <dialog
      ref={dialog}
      className={
        pending ? `${styles.dialog} ${confirmStyles.dialog}` : styles.dialog
      }
      aria-labelledby={pending ? "confirm-edit-title" : "edit-tank-title"}
      aria-describedby={pending ? "confirm-edit-description" : undefined}
      onClose={close}
      onCancel={(event) => {
        if (saving || pending) {
          event.preventDefault();
          if (!saving) {
            setPending(null);
            setError("");
          }
        }
      }}
      onClick={(event) => {
        if (!saving && event.target === event.currentTarget) {
          if (pending) {
            setPending(null);
            setError("");
          } else dialog.current?.close();
        }
      }}
    >
      <div hidden={!!pending}>
        <header className={styles.header}>
          <div>
            <h2 id="edit-tank-title">Edit Toren</h2>
            <p>Ubah data toren yang sudah ada</p>
            <button
              type="button"
              className={editStyles.historyLink}
              aria-expanded={historyOpen}
              onClick={() => {
                if (!historyOpen) void loadHistory(1);
                setHistoryOpen(!historyOpen);
              }}
            >
              Lihat riwayat perubahan
            </button>
          </div>
          <button
            type="button"
            className={styles.close}
            disabled={saving}
            aria-label="Tutup"
            onClick={() => dialog.current?.close()}
          >
            <LuX
              size={25}
              color="currentColor"
              aria-hidden="true"
              focusable="false"
            />
          </button>
        </header>
        {historyOpen && (
          <section
            className={editStyles.history}
            aria-label="Riwayat perubahan toren"
            aria-live="polite"
          >
            {historyState === "loading" ? (
              <p>Memuat riwayat…</p>
            ) : historyState === "error" ? (
              <p>Riwayat tidak dapat dimuat.</p>
            ) : (
              <>
                {history.length ? (
                  <ul>
                    {history.map((log) => (
                      <li key={log.id}>
                        <strong>{log.detail || log.action}</strong>
                        <time dateTime={log.createdAt}>
                          {new Date(log.createdAt).toLocaleString("id-ID")}
                        </time>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Tidak ada riwayat toren pada halaman ini.</p>
                )}
                <div className={editStyles.pagination}>
                  <button
                    type="button"
                    disabled={historyPage === 1}
                    onClick={() => void loadHistory(historyPage - 1)}
                  >
                    Sebelumnya
                  </button>
                  <span>Halaman {historyPage}</span>
                  <button
                    type="button"
                    disabled={!historyHasNext}
                    onClick={() => void loadHistory(historyPage + 1)}
                  >
                    Berikutnya
                  </button>
                </div>
              </>
            )}
          </section>
        )}
        <form onSubmit={submit}>
          <h3>Informasi Dasar</h3>
          <div className={styles.fields}>
            <label>
              Nama toren <span>*</span>{" "}
              {name !== tank.name && (
                <b className={editStyles.changed}>Diubah</b>
              )}
              <input
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                required
                autoFocus
                className={
                  name !== tank.name ? editStyles.changedInput : undefined
                }
              />
            </label>
            <label>
              Kode toren
              <input
                placeholder="Belum tersedia"
                disabled
                aria-describedby="edit-code-help"
              />
              <small id="edit-code-help">
                Kode toren belum didukung sistem.
              </small>
            </label>
            <label>
              Gedung{" "}
              {location !== (tank.location ?? "") && (
                <b className={editStyles.changed}>Diubah</b>
              )}
              <input
                name="location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                maxLength={150}
                placeholder="Masukkan nama gedung"
                className={
                  location !== (tank.location ?? "")
                    ? editStyles.changedInput
                    : undefined
                }
              />
            </label>
          </div>
          <h3 className={styles.capacityTitle}>Kapasitas</h3>
          <div className={styles.capacity}>
            <label>
              Kapasitas total (L) <span>*</span>{" "}
              {Number(capacity) !== Number(tank.capacityLiters) && (
                <b className={editStyles.changed}>Diubah</b>
              )}
              <input
                name="capacityLiters"
                type="number"
                min="0.01"
                step="any"
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                required
                className={
                  Number(capacity) !== Number(tank.capacityLiters)
                    ? editStyles.changedInput
                    : undefined
                }
              />
            </label>
            <label>
              Tinggi Toren (Cm)
              <input
                type="number"
                placeholder="Belum tersedia"
                disabled
                aria-describedby="edit-height-help"
              />
              <small id="edit-height-help">
                Tinggi toren belum didukung sistem.
              </small>
            </label>
          </div>
          <details className={editStyles.thresholds}>
            <summary>Pengaturan batas level air</summary>
            <div className={styles.capacity}>
              <label>
                Batas minimum (%) <span>*</span>
                <input
                  name="minThresholdPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  defaultValue={tank.minThresholdPercent}
                  required
                />
              </label>
              <label>
                Batas maksimum (%) <span>*</span>
                <input
                  name="maxThresholdPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  defaultValue={tank.maxThresholdPercent}
                  required
                />
              </label>
            </div>
          </details>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <footer className={styles.footer}>
            <p>
              <span>*</span> Data wajib dilengkapi
            </p>
            <div>
              <button
                type="button"
                className={styles.cancel}
                disabled={saving}
                onClick={() => dialog.current?.close()}
              >
                Batal
              </button>
              <button type="submit" className={styles.save} disabled={saving}>
                {saving ? "Menyimpan…" : "Simpan Toren"}
              </button>
            </div>
          </footer>
        </form>
      </div>
      {pending && (
        <div className={confirmStyles.content}>
          <h2 id="confirm-edit-title">Simpan perubahan?</h2>
          <p id="confirm-edit-description">
            {changedFields.length ? (
              <>
                Kamu mengubah {changedFields.join(", ")} untuk{" "}
                <strong>{tank.name}</strong>. Pastikan data sudah benar sebelum
                menyimpan.
              </>
            ) : (
              <>
                Tidak ada perubahan data untuk <strong>{tank.name}</strong>.
                Apakah kamu tetap ingin menyimpan?
              </>
            )}
          </p>
          {error && (
            <p className={confirmStyles.error} role="alert">
              {error}
            </p>
          )}
          <div className={confirmStyles.actions}>
            <button
              type="button"
              className={confirmStyles.cancel}
              autoFocus
              disabled={saving}
              onClick={() => {
                setPending(null);
                setError("");
              }}
            >
              Batal
            </button>
            <button
              type="button"
              className={confirmStyles.confirm}
              disabled={saving}
              onClick={() => void confirmSave()}
            >
              {saving ? "Menyimpan…" : "Ya, simpan perubahan"}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
