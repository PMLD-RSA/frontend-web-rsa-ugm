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
    const minDistanceCm = Number(data.get("minDistanceCm") || 30);
    const maxDistanceCm = Number(data.get("maxDistanceCm") || 350);
    const latRaw = String(data.get("latitude") ?? "").trim();
    const lngRaw = String(data.get("longitude") ?? "").trim();
    const latitude = latRaw === "" ? undefined : Number(latRaw);
    const longitude = lngRaw === "" ? undefined : Number(lngRaw);

    if (
      !name ||
      !location ||
      !Number.isFinite(capacityLiters) ||
      capacityLiters <= 0
    ) {
      setError("Lengkapi nama, gedung, dan kapasitas toren yang valid.");
      return;
    }

    if (minDistanceCm >= maxDistanceCm || minDistanceCm < 0) {
      setError("Jarak sensor saat penuh harus lebih kecil dari jarak saat kosong.");
      return;
    }

    if (
      (latitude !== undefined && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
      (longitude !== undefined && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))
    ) {
      setError("Koordinat GPS tidak valid (latitude -90..90, longitude -180..180).");
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
          minDistanceCm,
          maxDistanceCm,
          ...(latitude !== undefined ? { latitude } : {}),
          ...(longitude !== undefined ? { longitude } : {}),
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
            Gedung <span>*</span>
            <input
              name="location"
              placeholder="Masukkan nama gedung"
              maxLength={150}
              required
            />
          </label>
          <label>
            Latitude (Opsional)
            <input
              name="latitude"
              type="number"
              min="-90"
              max="90"
              step="any"
              placeholder="Contoh: -7.775117"
            />
          </label>
          <label>
            Longitude (Opsional)
            <input
              name="longitude"
              type="number"
              min="-180"
              max="180"
              step="any"
              placeholder="Contoh: 110.373661"
            />
          </label>
        </div>
        <h3 className={styles.capacityTitle}>Kapasitas & Kalibrasi Jarak Sensor</h3>
        <div className={styles.capacity}>
          <label>
            Kapasitas total (L) <span>*</span>
            <input
              name="capacityLiters"
              type="number"
              min="0.01"
              step="any"
              placeholder="Contoh: 10000"
              required
            />
          </label>
          <label>
            Jarak Saat Penuh / Min (cm) <span>*</span>
            <input
              name="minDistanceCm"
              type="number"
              min="0"
              step="any"
              defaultValue="30"
              placeholder="Default: 30 cm"
              required
            />
          </label>
          <label>
            Jarak Saat Kosong / Max (cm) <span>*</span>
            <input
              name="maxDistanceCm"
              type="number"
              min="1"
              step="any"
              defaultValue="350"
              placeholder="Default: 350 cm"
              required
            />
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
              {saving ? "Menyimpan..." : "Simpan Toren"}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
