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
        throw new Error(result.message || "Could not delete the tank.");
      deleted();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not delete the tank.",
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
        <h2 id="delete-tank-title">Delete tank?</h2>
      </header>
      <p id="delete-tank-description" className={styles.deleteDescription}>
        Tank <strong>{tank.name}</strong> will be permanently deleted, including its readings, alerts, and linked sensors.
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
          Cancel
        </button>
        <button
          type="button"
          className={styles.confirmDelete}
          disabled={deleting}
          onClick={() => void remove()}
        >
          {deleting ? "Deleting..." : "Delete tank"}
        </button>
      </div>
    </dialog>
  );
}
