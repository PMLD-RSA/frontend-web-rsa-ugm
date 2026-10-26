'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { dateInputValue } from '@/lib/dashboard';
import { DashboardIcon as Icon } from './DashboardIcon';
import { AnchoredPopover } from './AnchoredPopover';
import styles from './DashboardPanels.module.css';

export interface DateRange { startDate: string; endDate: string }
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const parse = (value: string) => new Date(`${value}T12:00:00`);

export function DashboardCalendar({ value, mode = 'range', onChange }: { value: DateRange; mode?: 'single' | 'range'; onChange: (range: DateRange) => void }) {
  const initial = value.startDate || value.endDate || dateInputValue(new Date());
  const [month, setMonth] = useState(() => parse(initial));
  const [focusDate, setFocusDate] = useState(initial);
  const [pending, setPending] = useState('');
  const [hovered, setHovered] = useState('');
  const grid = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const dayCount = new Date(year, monthIndex + 1, 0).getDate();
  const cells = Math.max(35, Math.ceil((firstDay + dayCount) / 7) * 7);
  const today = dateInputValue(new Date());
  const yearStart = Math.min(year, new Date().getFullYear() - 100);
  const yearEnd = Math.max(year, new Date().getFullYear() + 20);
  const range = pending ? [pending, hovered || pending].sort() : [value.startDate, value.endDate];

  useEffect(() => {
    if (moveFocus.current) {
      grid.current?.querySelector<HTMLButtonElement>(`[data-date="${focusDate}"]`)?.focus();
      moveFocus.current = false;
    }
  }, [focusDate, month]);

  function navigate(next: Date, focus = false) {
    setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    setFocusDate(dateInputValue(next));
    moveFocus.current = focus;
  }

  function select(date: string) {
    if (mode === 'single') onChange({ startDate: date, endDate: date });
    else if (!pending) { setPending(date); setHovered(date); }
    else {
      const [startDate, endDate] = [pending, date].sort();
      onChange({ startDate, endDate });
    }
  }

  function onDayKey(event: KeyboardEvent<HTMLButtonElement>, date: string) {
    const next = parse(date);
    const delta: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -next.getDay(), End: 6 - next.getDay() };
    if (event.key in delta) next.setDate(next.getDate() + delta[event.key]);
    else if (event.key === 'PageUp' || event.key === 'PageDown') {
      const day = next.getDate();
      next.setDate(1);
      next.setMonth(next.getMonth() + (event.key === 'PageUp' ? -1 : 1));
      next.setDate(Math.min(day, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
    } else return;
    event.preventDefault();
    navigate(next, true);
  }

  return <div className={styles.calendar}>
    <div className={styles.calendarHeader}>
      <button type="button" aria-label="Bulan sebelumnya" onClick={() => navigate(new Date(year, monthIndex - 1, 1))}><Icon name="calendar-left" width={16} /></button>
      <div className={styles.calendarSelectors}>
        <div className={styles.calendarSelect}>
          <select aria-label="Bulan kalender" value={monthIndex} onChange={(event) => navigate(new Date(year, Number(event.target.value), 1))}>
            {months.map((name, index) => <option key={name} value={index}>{name}</option>)}
          </select>
          <Icon name="calendar-down" width={12} />
        </div>
        <div className={styles.calendarSelect}>
          <select aria-label="Tahun kalender" value={year} onChange={(event) => navigate(new Date(Number(event.target.value), monthIndex, 1))}>
            {Array.from({ length: yearEnd - yearStart + 1 }, (_, i) => yearStart + i).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <Icon name="calendar-down" width={12} />
        </div>
      </div>
      <button type="button" aria-label="Bulan berikutnya" onClick={() => navigate(new Date(year, monthIndex + 1, 1))}><Icon name="calendar-right" width={16} /></button>
    </div>
    <div className={styles.weekdays} aria-hidden="true">{weekdays.map(day => <span key={day}>{day}</span>)}</div>
    <div ref={grid} className={styles.calendarGrid} role="group" aria-label={`${months[monthIndex]} ${year}`} onMouseLeave={() => setHovered('')}>
      {Array.from({ length: cells }, (_, index) => {
        const day = new Date(year, monthIndex, index - firstDay + 1, 12);
        const date = dateInputValue(day);
        const outside = day.getMonth() !== monthIndex;
        const selected = date === range[0] || date === range[1];
        const between = Boolean(range[0] && range[1] && date > range[0] && date < range[1]);
        return <button key={date} type="button" disabled={outside} data-date={date} data-selected={selected} data-in-range={mode === 'range' && between} data-today={date === today} data-popup-focus={date === focusDate ? '' : undefined}
          aria-label={day.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} aria-pressed={selected} aria-current={date === today ? 'date' : undefined}
          tabIndex={!outside && date === focusDate ? 0 : -1} onFocus={() => setFocusDate(date)} onMouseEnter={() => setHovered(date)} onClick={() => select(date)} onKeyDown={(event) => onDayKey(event, date)}>{day.getDate()}</button>;
      })}
    </div>
    <span className={styles.srOnly} role="status">{mode === 'range' ? pending ? 'Pilih tanggal akhir.' : 'Pilih tanggal mulai, kemudian tanggal akhir.' : 'Pilih tanggal.'}</span>
  </div>;
}

export function DashboardDatePicker({ value, onChange, mode = 'range', label, triggerClassName, disabled, children }: { value: DateRange; onChange: (range: DateRange) => void; mode?: 'single' | 'range'; label: string; triggerClassName?: string; disabled?: boolean; children: ReactNode }) {
  const [revision, setRevision] = useState(0);
  return <AnchoredPopover label={label} disabled={disabled} align="start" trigger={children} triggerClassName={triggerClassName} className={styles.calendarPopover} onOpen={() => setRevision(value => value + 1)}>
    {(close) => <DashboardCalendar key={revision} value={value} mode={mode} onChange={(value) => { onChange(value); close(); }} />}
  </AnchoredPopover>;
}
