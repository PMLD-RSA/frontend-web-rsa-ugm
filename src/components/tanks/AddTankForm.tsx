"use client";

import { LuX } from "react-icons/lu";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ApiResponse } from "@/types";
import styles from "./TankForm.module.css";

export function AddTankForm({
  close,
  saved,
}: {
  close: () => void;
  saved: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const location = String(data.get("location") ?? "").trim();
    const capacityLiters = Number(data.get("capacityLiters"));
    if (
      !name ||
      !location ||
      !Number.isFinite(capacityLiters) ||
      capacityLiters <= 0
    ) {
      setError("Lengkapi nama, gedung, dan kapasitas toren yang valid.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/tanks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          location,
          capacityLiters,
          minThresholdPercent: 30,
          maxThresholdPercent: 90,
        }),
      });
      const result: ApiResponse = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message || "Toren gagal disimpan.");
      saved();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Toren gagal disimpan.",
      );
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="add-tank-title"
      onClose={close}
      onCancel={(event) => {
        if (saving) event.preventDefault();
      }}
      onClick={(event) => {
        if (!saving && event.target === event.currentTarget)
          dialog.current?.close();
      }}
    >
      <header className={styles.header}>
        <div>
          <h2 id="add-tank-title">Tambah Toren Baru</h2>
          <p>Daftarkan toren air di lokasi baru</p>
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
      <form onSubmit={submit}>
        <h3>Informasi Dasar</h3>
        <div className={styles.fields}>
          <label>
            Nama toren <span>*</span>
            <input
              name="name"
              placeholder="Harus unik dalam satu gedung"
              maxLength={100}
              required
              autoFocus
            />
          </label>
          <label>
            Kode toren
            <input
              placeholder="Belum tersedia"
              disabled
              aria-describedby="code-help"
            />
            <small id="code-help">Kode toren belum didukung sistem.</small>
          </label>
          <label>
            Gedung <span>*</span>
            <input
              name="location"
              placeholder="Masukkan nama gedung"
              maxLength={150}
              required
            />
          </label>
        </div>
        <h3 className={styles.capacityTitle}>Kapasitas</h3>
        <div className={styles.capacity}>
          <label>
            Kapasitas total (L) <span>*</span>
            <input
              name="capacityLiters"
              type="number"
              min="0.01"
              step="any"
              placeholder="Masukkan kapasitas toren"
              required
            />
          </label>
          <label>
            Tinggi Toren (Cm)
            <input
              type="number"
              placeholder="Belum tersedia"
              disabled
              aria-describedby="height-help"
            />
            <small id="height-help">Tinggi toren belum didukung sistem.</small>
          </label>
        </div>
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
    </dialog>
  );
}
