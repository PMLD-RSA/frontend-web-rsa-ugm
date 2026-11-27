"use client";

import { LuX } from "react-icons/lu";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ApiResponse, Gateway } from "@/types";
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
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [gatewayStatus, setGatewayStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const modal = dialog.current;
    if (modal && !modal.open) modal.showModal();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadGateways() {
      try {
        const response = await fetch("/api/gateways", { signal: controller.signal, cache: "no-store" });
        const result: ApiResponse<Gateway[]> = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok || !result.success || result.source === "mock" || !Array.isArray(result.data)) {
          setGatewayStatus("error");
          return;
        }
        setGateways(result.data);
        setGatewayStatus("ready");
      } catch {
        if (!controller.signal.aborted) setGatewayStatus("error");
      }
    }
    void loadGateways();
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const location = String(data.get("location") ?? "").trim();
    const latRaw = String(data.get("latitude") ?? "").trim();
    const lngRaw = String(data.get("longitude") ?? "").trim();
    const latitude = latRaw === "" ? NaN : Number(latRaw);
    const longitude = lngRaw === "" ? NaN : Number(lngRaw);
    const capacityLiters = Number(data.get("capacityLiters"));
    const minDistanceCm = Number(data.get("minDistanceCm") || 30);
    const maxDistanceCm = Number(data.get("maxDistanceCm") || 350);
    const deviceCode = String(data.get("deviceCode") ?? "").trim();
    const gatewayId = String(data.get("gatewayId") ?? "");
    const sensorType = String(data.get("sensorType") ?? "");

    if (
      !name ||
      !location ||
      !Number.isFinite(capacityLiters) ||
      capacityLiters <= 0
    ) {
      setError("Enter a valid tank name, building, and capacity.");
      return;
    }

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      setError("Enter valid latitude and longitude coordinates.");
      return;
    }

    if (minDistanceCm >= maxDistanceCm || minDistanceCm < 0) {
      setError("The sensor distance when full must be less than the distance when empty.");
      return;
    }

    if (!deviceCode || !gateways.some(gateway => gateway.id === gatewayId) || sensorType !== "ultrasonic") {
      setError("Enter a sensor device code and select a registered gateway.");
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
          latitude,
          longitude,
          capacityLiters,
          minThresholdPercent: 30,
          maxThresholdPercent: 90,
          minDistanceCm,
          maxDistanceCm,
          sensorNode: { deviceCode, gatewayId, sensorType },
        }),
      });
      const result: ApiResponse = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message || "Could not save the tank.");
      saved();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not save the tank.",
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
          <h2 id="add-tank-title">Add New Tank</h2>
          <p>Register a water tank at a new location</p>
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
      <form onSubmit={submit}>
        <h3>Basic Information</h3>
        <div className={styles.fields}>
          <label>
            Tank name <span>*</span>
            <input
              name="name"
              placeholder="Must be unique within the building"
              maxLength={100}
              required
              autoFocus
            />
          </label>
          <label>
            Building <span>*</span>
            <input
              name="location"
              placeholder="Enter the building name"
              maxLength={150}
              required
            />
          </label>
          <label>
            Latitude <span>*</span>
            <input name="latitude" type="number" min="-90" max="90" step="any" placeholder="Example: -7.7751167" required />
          </label>
          <label>
            Longitude <span>*</span>
            <input name="longitude" type="number" min="-180" max="180" step="any" placeholder="Example: 110.3736611" required />
            <small>Enter coordinates in decimal degrees, as shown in Google Maps.</small>
          </label>
        </div>
        <h3 className={styles.capacityTitle}>Sensor Node</h3>
        <div className={styles.fields}>
          <label>
            Sensor device code <span>*</span>
            <input name="deviceCode" placeholder="Example: STM32-DTK" maxLength={50} required />
            <small>Use the device code sent by the sensor.</small>
          </label>
          <label>
            Gateway <span>*</span>
            <select key={gatewayStatus} name="gatewayId" defaultValue={gateways.length === 1 ? gateways[0].id : ""} required disabled={!gateways.length}>
              <option value="" disabled>Select a gateway</option>
              {gateways.map(gateway => <option key={gateway.id} value={gateway.id}>{gateway.deviceCode}</option>)}
            </select>
            {gatewayStatus === "loading" && <small>Loading gateways...</small>}
            {gatewayStatus === "error" && <small role="alert">Could not load gateways from the server. Reopen this form to retry.</small>}
            {gatewayStatus === "ready" && !gateways.length && <small>Register a gateway before adding a tank.</small>}
          </label>
          <label>
            Sensor type <span>*</span>
            <select name="sensorType" defaultValue="ultrasonic" required>
              <option value="ultrasonic">Ultrasonic</option>
            </select>
          </label>
        </div>
        <h3 className={styles.capacityTitle}>Capacity & Sensor Distance Calibration</h3>
        <div className={styles.capacity}>
          <label>
            Total capacity (L) <span>*</span>
            <input
              name="capacityLiters"
              type="number"
              min="0.01"
              step="any"
              placeholder="Example: 10000"
              required
            />
          </label>
          <label>
            Distance when full / min (cm) <span>*</span>
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
            Distance when empty / max (cm) <span>*</span>
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
            <button type="submit" className={styles.save} disabled={saving || !gateways.length}>
              {saving ? "Saving..." : "Save Tank"}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
