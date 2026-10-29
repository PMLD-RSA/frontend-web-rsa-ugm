'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { MapPin, Maximize, Minimize, Minus, Plus, RotateCcw, X } from 'lucide-react';
import type { Tank } from '@/types';
import { getTankStatus } from '@/lib/dashboard';
import { TankDetails, statusLabels } from './TankLevel';
import styles from './TankDashboard.module.css';

type Position = { x: number; y: number };
type Positions = Record<string, Position>;
const storageKey = 'rsa-site-plan-positions-v1';

// Unconfirmed markers are explicitly labelled; geographic coordinates cannot be
// projected onto this uncalibrated floor plan.
function initialPosition(id: string): Position {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return { x: 42 + (hash % 4) * 10, y: 33 + (Math.floor(hash / 4) % 4) * 8 };
}

export function TankMap({ tanks, loading, unavailable, onDetail }: { tanks: Tank[]; loading: boolean; unavailable: boolean; onDetail: (tank: Tank) => void }) {
  const [positions, setPositions] = useState<Positions>({});
  const [status, setStatus] = useState('ALL');
  const [area, setArea] = useState('ALL');
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [notice, setNotice] = useState('');
  const section = useRef<HTMLElement>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored: unknown = JSON.parse(localStorage.getItem(storageKey) || '{}');
        const valid: Positions = {};
        if (stored && typeof stored === 'object') for (const [id, point] of Object.entries(stored)) {
          if (point && typeof point === 'object' && typeof point.x === 'number' && typeof point.y === 'number' && point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100) valid[id] = point;
        }
        setPositions(valid);
      } catch { setNotice('Posisi tersimpan tidak dapat dibaca. Titik sementara ditampilkan.'); }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const visible = tanks.filter(tank => (status === 'ALL' || (getTankStatus(tank) ?? 'UNKNOWN') === status) && (area === 'ALL' || tank.id === area));
  const current = visible.find(tank => tank.id === selected);
  function dismiss() { setSelected(null); }
  function closeAndFocus() {
    dismiss();
    lastTrigger.current?.focus({ preventScroll: true });
  }

  return <section ref={section} className={`${styles.panel} ${styles.mapPanel} ${expanded ? styles.expandedMap : ''}`} aria-label="Peta lokasi tangki" onKeyDown={event => {
    if (event.key === 'Escape') { closeAndFocus(); setExpanded(false); }
  }}>
    <header className={styles.panelHeader}><h2>Peta Lokasi Tangki</h2><div className={styles.mapFilters}>
      <select aria-label="Status tangki pada denah" value={status} onChange={event => { setStatus(event.target.value); dismiss(); }}>
        <option value="ALL">Semua Status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <select aria-label="Area tangki pada denah" value={area} onChange={event => { setArea(event.target.value); dismiss(); }}>
        <option value="ALL">Semua Area</option>{tanks.map(tank => <option key={tank.id} value={tank.id}>{tank.name}</option>)}
      </select>
      <button aria-label={expanded ? 'Kecilkan denah' : 'Perbesar denah'} onClick={() => setExpanded(!expanded)}>{expanded ? <Minimize size={16} /> : <Maximize size={16} />}</button>
    </div></header>
    <div className={styles.mapFrame}>
      <div className={styles.zoomControls}><button aria-label="Zoom masuk" disabled={zoom >= 3} onClick={() => setZoom(Math.min(3, zoom + .5))}><Plus size={18} /></button><button aria-label="Zoom keluar" disabled={zoom <= 1} onClick={() => setZoom(Math.max(1, zoom - .5))}><Minus size={18} /></button><button aria-label="Reset zoom" onClick={() => setZoom(1)}><RotateCcw size={15} /></button></div>
      <div className={styles.mapScroll}>
        <div className={styles.mapCanvas} style={{ width: `${zoom * 100}%` }}>
          <Image src="/images/dashboard/rsa-site-plan.jpg" alt="Denah Rumah Sakit Akademik Universitas Gadjah Mada" width={1824} height={1361} unoptimized className={styles.mapImage} />
          {visible.map(tank => <button key={tank.id} className={styles.marker} data-unconfirmed={!positions[tank.id]} title={`${tank.name}${!positions[tank.id] ? ' — posisi sementara' : ''}`} data-status={getTankStatus(tank) ?? 'UNKNOWN'} style={{ left: `${(positions[tank.id] ?? initialPosition(tank.id)).x}%`, top: `${(positions[tank.id] ?? initialPosition(tank.id)).y}%` }} aria-label={`Lihat ${tank.name}`} aria-expanded={selected === tank.id} aria-controls={current ? 'map-tank-preview' : undefined}
            onClick={event => { lastTrigger.current = event.currentTarget; setSelected(selected === tank.id ? null : tank.id); }}><MapPin size={30} fill="currentColor" /><span className={styles.markerDot} /></button>)}
        </div>
      </div>
      {current && <div id="map-tank-preview" className={styles.mapPopup} role="region" aria-label={`Ringkasan ${current.name}`}>
        <TankDetails tank={current} />
        {!positions[current.id] && <p className={styles.helper}>Posisi titik sementara, belum dikonfirmasi.</p>}
        <footer className={styles.popupFooter}><button onClick={() => onDetail(current)}>Lihat Detail</button><button aria-label="Tutup detail tangki" onClick={closeAndFocus}><X size={18} /></button></footer>
      </div>}
    </div>
    <div className={styles.legend}>{Object.entries(statusLabels).map(([value, label]) => <span key={value} data-status={value}><i />{label} ({visible.filter(tank => (getTankStatus(tank) ?? 'UNKNOWN') === value).length})</span>)}</div>
    <p className={styles.helper}>{loading ? 'Memuat lokasi tangki…' : unavailable ? 'Titik contoh Tangki A/B ditampilkan sementara. Data dan lokasi sebenarnya belum tersedia dari server.' : !visible.length ? 'Tidak ada tangki yang sesuai dengan filter.' : 'Klik titik untuk melihat detail tangki.'}</p>
    {!unavailable && visible.some(tank => !positions[tank.id]) && <p className={styles.helper}>Titik dengan lingkaran putus-putus memakai posisi sementara yang belum dikonfirmasi.</p>}
    {notice && <p className={styles.helper} role="status">{notice}</p>}
  </section>;
}
