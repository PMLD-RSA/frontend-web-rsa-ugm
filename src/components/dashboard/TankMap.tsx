'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Map as LeafletMap, LayerGroup } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Maximize, Minimize, X } from 'lucide-react';
import type { Tank } from '@/types';
import { getTankStatus } from '@/lib/dashboard';
import { TankDetails, statusLabels } from './TankLevel';
import styles from './TankDashboard.module.css';

const center: [number, number] = [-7.743218831538671, 110.35035361006075];
// Posisi pratinjau dipilih pada bagian tengah atap di citra Esri zoom 19.
const examplePositions: [number, number][] = [
  [-7.743063982213547, 110.34993588924408],
  [-7.743449356252616, 110.35064935684204],
];
const colors: Record<string, string> = { NORMAL: '#16a34a', WARNING: '#f59e0b', CRITICAL: '#e4002b', UNKNOWN: '#64748b' };

// Koreksi posisi tampilan sesuai permintaan pengguna. Koordinat backend kedua tangki ini
// masih menunjuk ke luar gedung; jangan menimpa data API atau status sensornya.
const correctedPositions: Record<string, [number, number]> = {
  'tangki atap gedung utama': examplePositions[0],
  'tangki gedung rawat inap': examplePositions[1],
};

function correctedPosition(tank: Tank) {
  return correctedPositions[tank.name.trim().toLowerCase()];
}

function coordinates(tank: Tank): [number, number] | null {
  const correction = correctedPosition(tank);
  if (correction) return correction;
  if (tank.latitude == null || tank.longitude == null || String(tank.latitude).trim() === '' || String(tank.longitude).trim() === '') return null;
  const lat = Number(tank.latitude), lng = Number(tank.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lat, lng] : null;
}

export function TankMap({ tanks, loading, unavailable, onDetail }: { tanks: Tank[]; loading: boolean; unavailable: boolean; onDetail: (tank: Tank) => void }) {
  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef<LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('ALL');
  const [area, setArea] = useState('ALL');
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const visible = useMemo(() => tanks.filter(tank => (status === 'ALL' || (getTankStatus(tank) ?? 'UNKNOWN') === status) && (area === 'ALL' || tank.id === area)), [tanks, status, area]);
  const current = visible.find(tank => tank.id === selected);
  const currentPosition = current ? coordinates(current) ?? examplePositions[[...tanks].map(tank => tank.id).sort().indexOf(current.id) % examplePositions.length] : null;

  useEffect(() => {
    let cancelled = false;
    void import('leaflet').then(L => {
      if (cancelled || !mapElement.current) return;
      const instance = L.map(mapElement.current, { maxZoom: 20 }).setView(center, 19);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 20, maxNativeZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      }).addTo(instance);
      map.current = instance;
      markers.current = L.layerGroup().addTo(instance);
      setReady(true);
    });
    return () => { cancelled = true; map.current?.remove(); map.current = null; markers.current = null; };
  }, []);

  useEffect(() => {
    if (!ready || !markers.current) return;
    let cancelled = false;
    void import('leaflet').then(L => {
      if (cancelled || !markers.current) return;
      markers.current.clearLayers();
      for (const tank of visible) {
        const actual = coordinates(tank);
        const index = [...tanks].map(item => item.id).sort().indexOf(tank.id);
        const position = actual ?? examplePositions[index % examplePositions.length];
        const color = colors[getTankStatus(tank) ?? 'UNKNOWN'];
        const icon = L.divIcon({ className: '', iconSize: [32, 40], iconAnchor: [16, 39], html: `<svg width="32" height="40" viewBox="0 0 32 40" aria-hidden="true"><path d="M16 39C12 33 2 24 2 16a14 14 0 0 1 28 0c0 8-10 17-14 23Z" fill="${color}" stroke="white" stroke-width="2" ${actual ? '' : 'stroke-dasharray="3 2"'}/><circle cx="16" cy="16" r="5" fill="white"/></svg>` });
        L.marker(position, { icon, title: `${tank.name}${actual ? '' : ' — temporary position'}`, keyboard: true }).on('click', () => setSelected(tank.id)).addTo(markers.current);
      }
    });
    return () => { cancelled = true; };
  }, [ready, tanks, visible]);

  useEffect(() => { map.current?.invalidateSize(); }, [expanded]);

  return <section className={`${styles.panel} ${styles.mapPanel} ${expanded ? styles.expandedMap : ''}`} aria-label="Tank location map" onKeyDown={event => { if (event.key === 'Escape') { setSelected(null); setExpanded(false); } }}>
    <header className={styles.panelHeader}><h2>Tank Location Map</h2><div className={styles.mapFilters}>
      <select aria-label="Tank status on map" value={status} onChange={event => { setStatus(event.target.value); setSelected(null); }}><option value="ALL">All Statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <select aria-label="Tank area on map" value={area} onChange={event => { setArea(event.target.value); setSelected(null); }}><option value="ALL">All Areas</option>{tanks.map(tank => <option key={tank.id} value={tank.id}>{tank.name}</option>)}</select>
      <button type="button" aria-label={expanded ? 'Collapse map' : 'Expand map'} onClick={() => setExpanded(!expanded)}>{expanded ? <Minimize size={16} /> : <Maximize size={16} />}</button>
    </div></header>
    <div className={styles.mapFrame}>
      <div ref={mapElement} className={styles.satelliteMap} aria-label="Peta satelit RSA UGM" />
      {current && <div className={styles.mapPopup} role="region" aria-label={`Summary ${current.name}`}><TankDetails tank={current} />{!coordinates(current) && <p className={styles.helper}>Temporary marker position, not yet confirmed.</p>}{currentPosition && <a className={styles.mapLink} href={`https://www.google.com/maps/search/?api=1&query=${currentPosition[0]},${currentPosition[1]}`} target="_blank" rel="noopener noreferrer"><MapPin size={15} aria-hidden="true" /> Open in Google Maps</a>}<footer className={styles.popupFooter}><button onClick={() => onDetail(current)}>View details</button><button aria-label="Close tank details" onClick={() => setSelected(null)}><X size={18} /></button></footer></div>}
    </div>
    <div className={styles.legend}>{Object.entries(statusLabels).map(([value, label]) => <span key={value} data-status={value}><i />{label} ({visible.filter(tank => (getTankStatus(tank) ?? 'UNKNOWN') === value).length})</span>)}</div>
    {(loading || unavailable || !visible.length) && <p className={styles.helper}>{loading ? 'Loading tank locations…' : unavailable ? 'Example tank markers A/B are shown temporarily. Actual server data is unavailable.' : 'No tanks match the selected filters.'}</p>}
    {visible.some(tank => !coordinates(tank)) && <p className={styles.helper}>Dashed markers indicate temporary positions because tank coordinates are unavailable.</p>}
  </section>;
}
