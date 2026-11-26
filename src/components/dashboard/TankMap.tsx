'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Map as LeafletMap, LayerGroup } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LuMaximize as Maximize, LuMinimize as Minimize, LuX as X } from "react-icons/lu";
import type { Tank } from '@/types';
import { getTankStatus } from '@/lib/dashboard';
import { vokasiTankName } from '@/lib/vokasiLocations';
import { TankDetails, statusLabels } from './TankLevel';
import styles from './TankDashboard.module.css';

const locations = [
  { id: 'DTEDI', name: 'DTEDI', position: [-7.7751166667, 110.3736611111] as [number, number], coordinateLabel: `7°46'30.42"S, 110°22'25.18"E` },
  { id: 'DTK', name: 'DTK', position: [-7.7747805556, 110.3743777778] as [number, number], coordinateLabel: `7°46'29.21"S, 110°22'27.76"E` },
  { id: 'DLIKES', name: 'DLIKES', position: [-7.7738361111, 110.3744027778] as [number, number], coordinateLabel: `7°46'25.81"S, 110°22'27.85"E` },
];

const colors: Record<string, string> = {
  NORMAL: '#16a34a',
  WARNING: '#f59e0b',
  CRITICAL: '#e4002b',
  UNKNOWN: '#64748b',
};

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

  const mapLocations = useMemo(() => {
    const matched = new Set<string>();
    const tankLocations = tanks.flatMap(tank => {
      const reference = locations.find(location =>
        vokasiTankName(tank.name) === location.id ||
        new RegExp(`(^|[^A-Z])${location.id}([^A-Z]|$)`, 'i').test(`${tank.name} ${tank.location ?? ''}`)
      );
      if (reference) matched.add(reference.id);
      const latitude = tank.latitude == null || String(tank.latitude).trim() === '' ? NaN : Number(tank.latitude);
      const longitude = tank.longitude == null || String(tank.longitude).trim() === '' ? NaN : Number(tank.longitude);
      const valid = Number.isFinite(latitude) && Math.abs(latitude) <= 90 && Number.isFinite(longitude) && Math.abs(longitude) <= 180;
      const position: [number, number] | undefined = reference?.position ?? (valid ? [latitude, longitude] : undefined);
      if (!position) return [];
      return [{ id: tank.id, name: tank.name, position, coordinateLabel: reference?.coordinateLabel ?? `${position[0]}, ${position[1]}`, tank, tankStatus: getTankStatus(tank) ?? 'UNKNOWN' }];
    });
    const placeholders = locations.filter(location => !matched.has(location.id)).map(location => ({
      ...location, tank: undefined, tankStatus: 'UNKNOWN',
    }));
    return [...tankLocations, ...placeholders];
  }, [tanks]);
  const visible = useMemo(() => mapLocations.filter(location =>
    (status === 'ALL' || location.tankStatus === status) &&
    (area === 'ALL' || location.id === area)
  ), [mapLocations, status, area]);

  const current = visible.find(location => location.id === selected);
  const currentTank = current?.tank;
  const currentDisplayTank = currentTank ?? null;

  useEffect(() => {
    let cancelled = false;
    void import('leaflet').then(L => {
      if (cancelled || !mapElement.current) return;
      const instance = L.map(mapElement.current, { maxZoom: 20 });
      instance.fitBounds(locations.map(location => location.position), { padding: [32, 32], maxZoom: 19 });
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
      for (const location of visible) {
        const color = colors[location.tankStatus];
        const icon = L.divIcon({
          className: '',
          iconSize: [32, 40],
          iconAnchor: [16, 39],
          html: `<svg width="32" height="40" viewBox="0 0 32 40" aria-hidden="true"><path d="M16 39C12 33 2 24 2 16a14 14 0 0 1 28 0c0 8-10 17-14 23Z" fill="${color}" stroke="white" stroke-width="2" ${location.tank ? '' : 'stroke-dasharray="3 2"'}/><circle cx="16" cy="16" r="5" fill="white"/></svg>`,
        });
        const tooltip = document.createElement('span');
        tooltip.textContent = location.name;
        L.marker(location.position, {
          icon,
          title: location.name,
          keyboard: true,
        })
          .on('click', () => setSelected(location.id))
          .bindTooltip(tooltip, { permanent: true, direction: 'top', offset: [0, -38] })
          .addTo(markers.current);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ready, visible]);

  useEffect(() => {
    if (ready && map.current && mapLocations.length) {
      map.current.fitBounds(mapLocations.map(location => location.position), { padding: [32, 32], maxZoom: 19 });
    }
  }, [ready, mapLocations]);

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
            {mapLocations.map(location => (
              <option key={location.id} value={location.id}>
                {location.name}
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
        <div ref={mapElement} className={styles.satelliteMap} aria-label="UGM Vocational School satellite map" />

        {current && (
          <div
            className={styles.mapPopup}
            role="region"
            aria-label={`Summary for ${current.name}`}
          >
            <button
              type="button"
              className={styles.popupCloseButton}
              aria-label="Close tank details"
              onClick={() => setSelected(null)}
            >
              <X size={15} />
            </button>

            {currentDisplayTank ? <TankDetails tank={currentDisplayTank} showSignal={false} /> : <div className={styles.detailHeading}><div><h3>{current.name}</h3><p>Tank data is not available for this location.</p></div></div>}
            <p className={styles.helper}>Coordinates: {current.coordinateLabel}</p>

            {currentDisplayTank && <footer className={styles.popupFooter}>
              <button
                type="button"
                className={styles.popupDetailButton}
                onClick={() => onDetail(currentDisplayTank)}
              >
                View details
              </button>
            </footer>}
          </div>
        )}
      </div>

      <div className={styles.legend}>
        {Object.entries(statusLabels).map(([value, label]) => (
          <span key={value} data-status={value}>
            <i />
            {label} ({visible.filter(location => location.tankStatus === value).length})
          </span>
        ))}
      </div>
      {(loading || unavailable || !visible.length) && (
        <p className={styles.helper}>
          {loading
            ? 'Loading tank data...'
            : unavailable
            ? 'Tank data is currently unavailable.'
            : 'No locations match the selected filters.'}
        </p>
      )}
    </section>
  );
}
