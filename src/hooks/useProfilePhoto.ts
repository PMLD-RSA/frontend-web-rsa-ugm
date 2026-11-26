'use client';

import { useCallback, useSyncExternalStore } from 'react';

const photoEvent = 'rsa-profile-photo-change';
const serverPhoto = () => null;

export function useProfilePhoto(userId?: string) {
  const key = userId ? `rsa-profile-photo:${encodeURIComponent(userId)}` : null;
  const subscribe = useCallback((notify: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) notify();
    };
    const onPhotoChange = (event: Event) => {
      if ((event as CustomEvent<string>).detail === key) notify();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(photoEvent, onPhotoChange);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(photoEvent, onPhotoChange);
    };
  }, [key]);

  const getPhoto = useCallback(() => {
    if (!key) return null;
    try {
      const photo = localStorage.getItem(key);
      return photo && /^data:image\/(jpeg|png|webp);base64,/.test(photo) ? photo : null;
    } catch {
      return null;
    }
  }, [key]);

  const photo = useSyncExternalStore(subscribe, getPhoto, serverPhoto);
  const setPhoto = useCallback((value: string | null) => {
    if (!key) throw new Error('Data akun belum tersedia.');
    try {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    } catch {
      throw new Error('Foto tidak dapat disimpan. Periksa ruang penyimpanan dan izin browser.');
    }
    window.dispatchEvent(new CustomEvent(photoEvent, { detail: key }));
  }, [key]);

  return { photo, setPhoto };
}
