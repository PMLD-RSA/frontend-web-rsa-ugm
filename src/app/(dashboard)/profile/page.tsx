'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { NotificationPopover } from '@/components/dashboard/NotificationPopover';
import { LuSearch as Search } from "react-icons/lu";
import styles from './profile.module.css';


const accountDate = (value?: string) => value && Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleDateString('en-GB', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' })
  : 'Unavailable';

export default function ProfilePage() {
  const user = useAuthStore(state => state.user);
  const isLoading = useAuthStore(state => state.isLoading);
  const fetchMe = useAuthStore(state => state.fetchMe);
  const { photo, setPhoto } = useProfilePhoto(user?.id);
  const photoInput = useRef<HTMLInputElement>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoFeedback, setPhotoFeedback] = useState<{ message: string; error: boolean } | null>(null);
  const [query, setQuery] = useState('');
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setToday(new Date()));
    return () => cancelAnimationFrame(frame);
  }, []);

  async function changePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file || photoBusy) return;
    setPhotoFeedback(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoFeedback({ message: 'Select a JPG, PNG, or WebP photo.', error: true });
      return;
    }
    if (!file.size || file.size > 2 * 1024 * 1024) {
      setPhotoFeedback({ message: 'Choose a nonempty photo up to 2 MB.', error: true });
      return;
    }
    setPhotoBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read the photo.'));
        reader.onerror = () => reject(new Error('Could not read the photo.'));
        reader.readAsDataURL(file);
      });
      const image = new window.Image();
      image.src = dataUrl;
      try { await image.decode(); } catch { throw new Error('Invalid image file. Choose another photo.'); }
      setPhoto(dataUrl);
      setPhotoFeedback({ message: 'Profile photo updated.', error: false });
    } catch (error) {
      setPhotoFeedback({ message: error instanceof Error ? error.message : 'Could not update the photo.', error: true });
    } finally {
      setPhotoBusy(false);
    }
  }

  function removePhoto() {
    try {
      setPhoto(null);
      setPhotoFeedback({ message: 'Profile photo removed.', error: false });
    } catch (error) {
      setPhotoFeedback({ message: error instanceof Error ? error.message : 'Could not remove the photo.', error: true });
    }
  }

  if (!user) return (
    <section className={styles.page} aria-label="Profile">
      <h1>Profile</h1>
      <p role="status">{isLoading ? 'Loading profile...' : 'Account data is unavailable. Reload your profile or sign in again.'}</p>
      <div className={styles.recovery}>
        <button type="button" onClick={() => void fetchMe()} disabled={isLoading}>Reload profile</button>
        <Link href="/login">Sign in again</Link>
      </div>
    </section>
  );

  const initials = user.username.slice(0, 2).toUpperCase();
  const email = 'email' in user && typeof user.email === 'string' && user.email.trim() ? user.email : null;
  const fields = [
    { id: 'username', label: 'Username', value: user.username },
    { id: 'role', label: 'Role', value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
    { id: 'status', label: 'Account status', value: typeof user.isActive === 'boolean' ? user.isActive ? 'Active' : 'Inactive' : 'Unavailable' },
    { id: 'created-at', label: 'Member since', value: accountDate(user.createdAt) },
    { id: 'language', label: 'Application language', value: 'English', setting: true },
    { id: 'timezone', label: 'Application time zone', value: 'Asia/Jakarta (WIB)', setting: true },
  ];
  const search = query.trim().toLocaleLowerCase('en-GB');
  const visibleFields = fields.filter(field => `${field.label} ${field.value}`.toLocaleLowerCase('en-GB').includes(search));

  return (
    <section className={styles.page} aria-label="Profile">
      <header className={styles.header}>
        <div className={styles.welcome}>
          <h1>Welcome, {user.username}</h1>
          <time dateTime={today?.toISOString()}>{today ? today.toLocaleDateString('en-GB', { timeZone: 'Asia/Jakarta', weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' }) : 'Loading date...'}</time>
        </div>
        <div className={styles.headerActions}>
          <label className="app-search">
            <Search size={16} aria-hidden="true" />
            <input type="search" placeholder="Search profile details..." aria-label="Search profile information" aria-controls="profile-details" value={query} onChange={event => setQuery(event.target.value)} />
          </label>
          <NotificationPopover className={styles.notification} panelClassName={styles.notificationPanel} icon={<Image src="/images/profile/notification.svg" alt="" width={25.1707} height={25.1707} unoptimized />} />
          <a href="#profile-identity" className={styles.headerAvatar} aria-label={`Profile ${user.username}`}>
            {photo ? <Image src={photo} alt="" width={52} height={52} unoptimized /> : initials}
          </a>
        </div>
      </header>

      <div className={styles.banner} aria-hidden="true">
        <Image src="/images/profile/banner.png" alt="" width={1282} height={100} priority unoptimized />
      </div>

      <div className={styles.content}>
        <div id="profile-identity" className={styles.identity}>
          <div className={styles.identityDetails}>
            <button type="button" className={styles.avatar} aria-label="Change profile photo" disabled={photoBusy} onClick={() => photoInput.current?.click()}>
              {photo ? <Image src={photo} alt="" width={100} height={100} unoptimized /> : initials}
            </button>
            <div className={styles.name}>
              <h2>{user.username}</h2>
              <p>{email || 'Email unavailable'}</p>
              <div className={styles.photoActions}>
                <button type="button" disabled={photoBusy} onClick={() => photoInput.current?.click()}>{photoBusy ? 'Saving...' : 'Change photo'}</button>
                {photo && <button type="button" disabled={photoBusy} onClick={removePhoto}>Remove photo</button>}
              </div>
            </div>
          </div>
          <button type="button" className={styles.edit} disabled aria-describedby="profile-edit-note">Edit</button>
        </div>

        <div className={styles.photoSettings}>
          <input ref={photoInput} className={styles.fileInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload profile photo" disabled={photoBusy} onChange={event => void changePhoto(event)} />
          <p>Choose a JPG, PNG, or WebP file up to 2 MB. Your photo is stored in this browser for your account.</p>
          {photoFeedback && <p className={photoFeedback.error ? styles.photoError : styles.photoSuccess} role={photoFeedback.error ? 'alert' : 'status'}>{photoFeedback.message}</p>}
        </div>

        <div id="profile-details" className={styles.fields}>
          {visibleFields.map(field => (
            <label className={styles.field} key={field.id}>
              <span>{field.label}</span>
              <span className={styles.fieldValue}>
                <input value={field.value} readOnly aria-readonly="true" />
                {field.setting && <Image src="/images/profile/chevron.svg" alt="" width={24} height={24} unoptimized />}
              </span>
            </label>
          ))}
        </div>
        {!visibleFields.length && <p className={styles.empty} role="status">No profile information matches your search.</p>}

        <section className={styles.email} aria-labelledby="profile-email-title">
          <h2 id="profile-email-title">My email Address</h2>
          <div className={styles.emailDetails}>
            <span className={styles.emailIcon}><Image src="/images/profile/email.svg" alt="" width={24} height={24} unoptimized /></span>
            <div>
              <p>{email || 'Unavailable'}</p>
              <small>{email ? 'Account email' : 'No email address is available for this account.'}</small>
            </div>
          </div>
          <button type="button" className={styles.addEmail} disabled aria-describedby="profile-edit-note">+Add Email Address</button>
          <p id="profile-edit-note" className={styles.editNote}>Personal information and email editing are currently unavailable.</p>
        </section>
      </div>
    </section>
  );
}
