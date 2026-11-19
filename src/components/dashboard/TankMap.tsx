'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Map as LeafletMap, LayerGroup } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LuMaximize as Maximize, LuMinimize as Minimize, LuX as X } from "react-icons/lu";
import type { Tank } from '@/types';
import { getTankStatus } from '@/lib/dashboard';
import { VOKASI_LOCATIONS } from '@/lib/vokasiLocations';
import { TankDetails, statusLabels } from './TankLevel';
import styles from './TankDashboard.module.css';

const center: [number, number] = [
  (VOKASI_LOCATIONS[0].latitude + VOKASI_LOCATIONS[2].latitude) / 2,
  (VOKASI_LOCATIONS[0].longitude + VOKASI_LOCATIONS[2].longitude) / 2,
];

const colors: Record<string, string> = {
  NORMAL: '#16a34a',
  WARNING: '#f59e0b',
  CRITICAL: '#e4002b',
  UNKNOWN: '#64748b',
};

function coordinates(tank: Tank): [number, number] | null {
  const labels = `${tank.name} ${tank.location ?? ''}`.toUpperCase().split(/[^A-Z0-9]+/);
  const site = VOKASI_LOCATIONS.find(({ name }) => labels.includes(name));
  if (site) return [site.latitude, site.longitude];

  if (
    tank.latitude == null ||
    tank.longitude == null ||
    String(tank.latitude).trim() === '' ||
    String(tank.longitude).trim() === ''
  ) {
    return null;
  }
  const lat = Number(tank.latitude);
  const lng = Number(tank.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    ? [lat, lng]
    : null;
}

export function TankMap({
  tanks,
  loading,
  unavailable,
  onDetail,
}: {
  tanks: Tank[];
  loading: boolean;
  unavailable: boolean;
  onDetail: (tank: Tank) => void;
}) {
  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef<LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('ALL');
  const [area, setArea] = useState('ALL');
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const visible = useMemo(
    () =>
      tanks.filter(
        tank =>
          (status === 'ALL' || (getTankStatus(tank) ?? 'UNKNOWN') === status) &&
          (area === 'ALL' || tank.id === area)
      ),
    [tanks, status, area]
  );

  const current = visible.find(tank => tank.id === selected);

  useEffect(() => {
    let cancelled = false;
    void import('leaflet').then(L => {
      if (cancelled || !mapElement.current) return;
      const siteBounds = L.latLngBounds(VOKASI_LOCATIONS.map(({ latitude, longitude }) => [latitude, longitude]));
      const instance = L.map(mapElement.current, { maxZoom: 20 }).fitBounds(siteBounds, {
        padding: [40, 40],
        maxZoom: 19,
      });
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 20,
          maxNativeZoom: 19,
          attribution: 'Tiles &copy; Esri - Esri, Maxar, Earthstar Geographics, and GIS User Community',
        }
      ).addTo(instance);
      map.current = instance;
      markers.current = L.layerGroup().addTo(instance);
      setReady(true);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      markers.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !markers.current) return;
    let cancelled = false;
    void import('leaflet').then(L => {
      if (cancelled || !markers.current) return;
      markers.current.clearLayers();
      for (const tank of visible) {
        const actual = coordinates(tank);
        const position = actual ?? center;
        const color = colors[getTankStatus(tank) ?? 'UNKNOWN'];
        const icon = L.divIcon({
          className: '',
          iconSize: [32, 40],
          iconAnchor: [16, 39],
          html: `<svg width="32" height="40" viewBox="0 0 32 40" aria-hidden="true"><path d="M16 39C12 33 2 24 2 16a14 14 0 0 1 28 0c0 8-10 17-14 23Z" fill="${color}" stroke="white" stroke-width="2" ${actual ? '' : 'stroke-dasharray="3 2"'}/><circle cx="16" cy="16" r="5" fill="white"/></svg>`,
        });
        L.marker(position, {
          icon,
          title: tank.name,
          keyboard: true,
        })
          .on('click', () => setSelected(tank.id))
          .addTo(markers.current);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ready, visible]);

  useEffect(() => {
    map.current?.invalidateSize();
  }, [expanded]);

  return (
    <section
      className={`${styles.panel} ${styles.mapPanel} ${expanded ? styles.expandedMap : ''}`}
      aria-label="Tank location map"
      onKeyDown={event => {
        if (event.key === 'Escape') {
          setSelected(null);
          setExpanded(false);
        }
      }}
    >
      <header className={styles.panelHeader}>
        <h2>Tank Location Map</h2>
        <div className={styles.mapFilters}>
          <select
            aria-label="Tank status on map"
            value={status}
            onChange={event => {
              setStatus(event.target.value);
              setSelected(null);
            }}
          >
            <option value="ALL">All Statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="Tank area on map"
            value={area}
            onChange={event => {
              setArea(event.target.value);
              setSelected(null);
            }}
          >
            <option value="ALL">All Areas</option>
            {tanks.map(tank => (
              <option key={tank.id} value={tank.id}>
                {tank.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            aria-label={expanded ? 'Collapse map' : 'Expand map'}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </header>

      <div className={styles.mapFrame}>
        <div ref={mapElement} className={styles.satelliteMap} aria-label="Peta satelit Sekolah Vokasi UGM" />

        {current && (
          <div
            className={styles.mapPopup}
            role="region"
            aria-label={`Ringkasan ${current.name}`}
          >
            <button
              type="button"
              className={styles.popupCloseButton}
              aria-label="Tutup detail tangki"
              onClick={() => setSelected(null)}
            >
              <X size={15} />
            </button>

            <TankDetails tank={current} showSignal={false} />

            <footer className={styles.popupFooter}>
              <button
                type="button"
                className={styles.popupDetailButton}
                onClick={() => onDetail(current)}
              >
                View details
              </button>
            </footer>
          </div>
        )}
      </div>

      <div className={styles.legend}>
        {Object.entries(statusLabels).map(([value, label]) => (
          <span key={value} data-status={value}>
            <i />
            {label} ({visible.filter(tank => (getTankStatus(tank) ?? 'UNKNOWN') === value).length})
          </span>
        ))}
      </div>
      {(loading || unavailable || !visible.length) && (
        <p className={styles.helper}>
          {loading
            ? 'Memuat lokasi tangki...'
            : unavailable
            ? 'Data tangki saat ini tidak tersedia.'
            : 'Tidak ada tangki yang sesuai dengan filter yang dipilih.'}
        </p>
      )}
    </section>
  );
}
