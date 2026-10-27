'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import styles from './DashboardPanels.module.css';

interface Props {
  label: string;
  trigger: ReactNode;
  triggerClassName?: string;
  className?: string;
  active?: boolean;
  disabled?: boolean;
  align?: 'start' | 'end';
  onOpen?: () => void;
  children: (close: () => void) => ReactNode;
}

export function AnchoredPopover({ label, trigger, triggerClassName, className = '', active, disabled, align = 'end', onOpen, children }: Props) {
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const position = useCallback(() => {
    if (!button.current || !panel.current?.matches(':popover-open')) return;
    const anchor = button.current.getBoundingClientRect();
    const bounds = panel.current.getBoundingClientRect();
    const left = align === 'start' ? anchor.left : anchor.right - bounds.width;
    const below = anchor.bottom + 8;
    panel.current.style.left = `${Math.max(8, Math.min(left, window.innerWidth - bounds.width - 8))}px`;
    panel.current.style.top = `${Math.max(8, Math.min(below + bounds.height <= window.innerHeight - 8 ? below : anchor.top - bounds.height - 8, window.innerHeight - bounds.height - 8))}px`;
  }, [align]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', position);
    document.addEventListener('scroll', position, true);
    const observer = new ResizeObserver(position);
    if (panel.current) observer.observe(panel.current);
    return () => {
      window.removeEventListener('resize', position);
      document.removeEventListener('scroll', position, true);
      observer.disconnect();
    };
  }, [open, position]);

  function close() {
    document.getElementById(id)?.hidePopover();
    document.getElementById(`${id}-trigger`)?.focus({ preventScroll: true });
  }

  return <>
    <button ref={button} id={`${id}-trigger`} disabled={disabled} type="button" className={triggerClassName} aria-label={label} aria-expanded={open} aria-haspopup="dialog" popoverTarget={id} data-active={active} onClick={() => {
      if (!open) onOpen?.();
    }}>{trigger}</button>
    <div ref={panel} id={id} popover="auto" role="dialog" aria-label={label} className={`${styles.anchored} ${className}`} onToggle={(event) => {
      const visible = event.currentTarget.matches(':popover-open');
      setOpen(visible);
      if (visible) {
        position();
        event.currentTarget.querySelector<HTMLElement>('[data-popup-focus]')?.focus({ preventScroll: true });
      }
    }}>{children(close)}</div>
  </>;
}
