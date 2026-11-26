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
  minDistanceCm: number;
  maxDistanceCm: number;
  latitude?: number | null;
  longitude?: number | null;
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
    const minDistanceCm = Number(data.get("minDistanceCm") || tank.minDistanceCm || 30);
    const maxDistanceCm = Number(data.get("maxDistanceCm") || tank.maxDistanceCm || 350);
    const latRaw = String(data.get("latitude") ?? "").trim();
    const lngRaw = String(data.get("longitude") ?? "").trim();
    const latitude = latRaw === "" ? null : Number(latRaw);
    const longitude = lngRaw === "" ? null : Number(lngRaw);
    if (
      !name.trim() ||
      !Number.isFinite(capacityLiters) ||
      capacityLiters <= 0 ||
      !Number.isFinite(minThresholdPercent) ||
      !Number.isFinite(maxThresholdPercent) ||
      minThresholdPercent < 0 ||
      maxThresholdPercent > 100 ||
      minThresholdPercent >= maxThresholdPercent ||
      minDistanceCm >= maxDistanceCm ||
      minDistanceCm < 0 ||
      (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
      (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))
    ) {
      setError(
        "Check the name, capacity, water level thresholds, sensor calibration, and tank GPS coordinates.",
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
      minDistanceCm,
      maxDistanceCm,
      ...(latitude !== null ? { latitude } : {}),
      ...(longitude !== null ? { longitude } : {}),
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
        throw new Error(result.message || "Could not save tank details.");
      saved();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not save tank details.",
      );
      setSaving(false);
    }
  }

  const changedFields = pending
    ? [
        pending.name !== tank.name && "name",
        pending.location !== (tank.location ?? "") && "building",
        pending.capacityLiters !== Number(tank.capacityLiters) && "capacity",
        pending.minThresholdPercent !== Number(tank.minThresholdPercent) &&
          "minimum threshold",
        pending.maxThresholdPercent !== Number(tank.maxThresholdPercent) &&
          "maximum threshold",
        pending.minDistanceCm !== Number(tank.minDistanceCm) &&
          "distance when full",
        pending.maxDistanceCm !== Number(tank.maxDistanceCm) &&
          "distance when empty",
        pending.latitude !== undefined &&
          pending.latitude !== (tank.latitude != null ? Number(tank.latitude) : null) &&
          "latitude",
        pending.longitude !== undefined &&
          pending.longitude !== (tank.longitude != null ? Number(tank.longitude) : null) &&
          "longitude",
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
            <h2 id="edit-tank-title">Edit Tank</h2>
            <p>Update tank details</p>
            <button
              type="button"
              className={editStyles.historyLink}
              aria-expanded={historyOpen}
              onClick={() => {
                if (!historyOpen) void loadHistory(1);
                setHistoryOpen(!historyOpen);
              }}
            >
              View change history
            </button>
          </div>
          <button
            type="button"
            className={styles.close}
            disabled={saving}
            aria-label="Close"
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
            aria-label="Tank change history"
            aria-live="polite"
          >
            {historyState === "loading" ? (
              <p>Loading history...</p>
            ) : historyState === "error" ? (
              <p>Could not load history.</p>
            ) : (
              <>
                {history.length ? (
                  <ul>
                    {history.map((log) => (
                      <li key={log.id}>
                        <strong>{log.detail || log.action}</strong>
                        <time dateTime={log.createdAt}>
                          {new Date(log.createdAt).toLocaleString("en-GB")}
                        </time>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No tank history on this page.</p>
                )}
                <div className={editStyles.pagination}>
                  <button
                    type="button"
                    disabled={historyPage === 1}
                    onClick={() => void loadHistory(historyPage - 1)}
                  >
                    Previous
                  </button>
                  <span>Page {historyPage}</span>
                  <button
                    type="button"
                    disabled={!historyHasNext}
                    onClick={() => void loadHistory(historyPage + 1)}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </section>
        )}
        <form onSubmit={submit}>
          <h3>Basic Information</h3>
          <div className={styles.fields}>
            <label>
              Tank name <span>*</span>{" "}
              {name !== tank.name && (
                <b className={editStyles.changed}>Changed</b>
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
              Tank code
              <input
                placeholder="Unavailable"
                disabled
                aria-describedby="edit-code-help"
              />
              <small id="edit-code-help">
                Tank codes are currently unavailable.
              </small>
            </label>
            <label>
              Building{" "}
              {location !== (tank.location ?? "") && (
                <b className={editStyles.changed}>Changed</b>
              )}
              <input
                name="location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                maxLength={150}
                placeholder="Enter the building name"
                className={
                  location !== (tank.location ?? "")
                    ? editStyles.changedInput
                    : undefined
                }
              />
            </label>
            <label>
              Latitude (Optional)
              <input
                name="latitude"
                type="number"
                min="-90"
                max="90"
                step="any"
                defaultValue={tank.latitude ?? ""}
                placeholder="Example: -7.775117"
              />
            </label>
            <label>
              Longitude (Optional)
              <input
                name="longitude"
                type="number"
                min="-180"
                max="180"
                step="any"
                defaultValue={tank.longitude ?? ""}
                placeholder="Example: 110.373661"
              />
            </label>
          </div>
          <h3 className={styles.capacityTitle}>Capacity</h3>
          <div className={styles.capacity}>
            <label>
              Total capacity (L) <span>*</span>{" "}
              {Number(capacity) !== Number(tank.capacityLiters) && (
                <b className={editStyles.changed}>Changed</b>
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
              Distance when full / min (cm) <span>*</span>
              <input
                name="minDistanceCm"
                type="number"
                min="0"
                step="any"
                defaultValue={tank.minDistanceCm ?? 30}
                required
              />
            </label>
            <label>
              Distance when empty / max (cm) <span>*</span>
              <input
                name="maxDistanceCm"
                type="number"
                min="1"
                step="any"
                defaultValue={tank.maxDistanceCm ?? 350}
                required
              />
            </label>
          </div>
          <details className={editStyles.thresholds}>
            <summary>Water level thresholds</summary>
            <div className={styles.capacity}>
              <label>
                Minimum threshold (%) <span>*</span>
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
                Maximum threshold (%) <span>*</span>
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
              <span>*</span> Required fields
            </p>
            <div>
              <button
                type="button"
                className={styles.cancel}
                disabled={saving}
                onClick={() => dialog.current?.close()}
              >
                Cancel
              </button>
              <button type="submit" className={styles.save} disabled={saving}>
                {saving ? "Saving..." : "Save Tank"}
              </button>
            </div>
          </footer>
        </form>
      </div>
      {pending && (
        <div className={confirmStyles.content}>
          <h2 id="confirm-edit-title">Save changes?</h2>
          <p id="confirm-edit-description">
            {changedFields.length ? (
              <>
                You changed {changedFields.join(", ")} for{" "}
                <strong>{tank.name}</strong>. Check the details before saving.
              </>
            ) : (
              <>
                No changes were made to <strong>{tank.name}</strong>. Save anyway?
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
              Cancel
            </button>
            <button
              type="button"
              className={confirmStyles.confirm}
              disabled={saving}
              onClick={() => void confirmSave()}
            >
              {saving ? "Saving..." : "Yes, save changes"}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
