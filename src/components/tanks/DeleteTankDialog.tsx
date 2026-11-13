"use client";

import { useEffect, useRef, useState } from "react";
import type { ApiResponse, Tank } from "@/types";
import styles from "./TanksPage.module.css";

export function DeleteTankDialog({
  tank,
  close,
  deleted,
}: {
  tank: Tank;
  close: () => void;
  deleted: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  async function remove() {
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(
        `/api/tanks/${encodeURIComponent(tank.id)}`,
        { method: "DELETE" },
      );
      const result: ApiResponse = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message || "Tangki gagal dihapus.");
      deleted();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Tangki gagal dihapus.",
      );
      setDeleting(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className={`${styles.dialog} ${styles.formDialog}`}
      aria-labelledby="delete-tank-title"
      aria-describedby="delete-tank-description"
      onClose={close}
      onCancel={(event) => {
        if (deleting) event.preventDefault();
      }}
    >
      <header>
        <h2 id="delete-tank-title">Hapus tangki?</h2>
      </header>
      <p id="delete-tank-description" className={styles.deleteDescription}>
        Tangki <strong>{tank.name}</strong> akan dihapus permanen, termasuk
        pembacaan, peringatan, dan sensor yang terhubung.
      </p>
      {error && (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      )}
      <div className={styles.formActions}>
        <button
          type="button"
          autoFocus
          disabled={deleting}
          onClick={() => dialog.current?.close()}
        >
          Batal
        </button>
        <button
          type="button"
          className={styles.confirmDelete}
          disabled={deleting}
          onClick={() => void remove()}
        >
          {deleting ? "Menghapus…" : "Hapus tangki"}
        </button>
      </div>
    </dialog>
  );
}
