'use client';

import Image from 'next/image';
import localFont from 'next/font/local';
import { FormEvent, Suspense, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import styles from './login.module.css';

const plusJakartaSans = localFont({
  src: [
    { path: './fonts/PlusJakartaSans-VariableFont_wght.ttf', weight: '200 800', style: 'normal' },
    { path: './fonts/PlusJakartaSans-Italic-VariableFont_wght.ttf', weight: '200 800', style: 'italic' },
  ],
  display: 'swap',
});

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [interactionNotice, setInteractionNotice] = useState('');
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [touched, setTouched] = useState({ username: false, password: false });
  const [focusedField, setFocusedField] = useState<'username' | 'password' | null>(null);
  const usernameError = touched.username && !username.trim()
    ? 'Masukkan username Anda.'
    : '';
  // Only classify credential errors; connection and other API errors retain their message.
  const rejectedCredentials = !!error && /^(Username atau password salah\.(?: \(Mock\))?|Invalid credentials\.?|Email or password (?:is )?incorrect\.?)$/i.test(error);
  const rejectedPassword = !!error && /^(Password salah\.?|Incorrect password\.?|Invalid password\.?)$/i.test(error);
  const passwordError = touched.password && !password
    ? 'Masukkan password Anda.'
    : rejectedPassword
      ? 'Enter a valid password, your password is incorrect.'
      : rejectedCredentials
        ? 'Check your username and password and try again.'
        : '';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();
    setTouched({ username: true, password: true });
    if (!username.trim()) {
      usernameRef.current?.focus();
      return;
    }
    if (!password) {
      passwordRef.current?.focus();
      return;
    }
    const success = await login(username.trim(), password);
    if (success) {
      router.push(searchParams.get('from') || '/');
      router.refresh();
    }
  }

  return (
    <main className={`${styles.page} ${plusJakartaSans.className}`}>
      <div className={styles.background} aria-hidden="true">
        <Image src="/images/login-tank-background.png" alt="" fill priority sizes="100vw" />
      </div>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a className={styles.brand} href="/login" aria-label="RSA UGM — halaman login">
            <Image src="/images/login-ugm-mark.png" alt="Lambang Universitas Gadjah Mada" width={44} height={46} priority />
            <Image src="/images/login-rsa-logo.png" alt="Rumah Sakit Akademik UGM" width={160} height={50} priority />
          </a>
          <nav className={styles.navigation} aria-label="Navigasi utama">
            <span>Tentang Sistem</span>
            <span>Bantuan</span>
          </nav>
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.visual} aria-label="Informasi sistem pemantauan tangki air">
          <div className={styles.visualBackground}>
            <Image src="/images/login-illustration-background.png" alt="" fill priority sizes="(min-width: 768px) 60vw, 100vw" />
          </div>
          <div className={styles.quote}>
            <p className={styles.quoteText}>“Smarter water tank monitoring, real-time insights, and automated water management — all in one integrated system.”</p>
            <div className={styles.credit}>
              <span className={styles.creditRule} aria-hidden="true" />
              <div>
                <p className={styles.creditTitle}>Powered by IoT Edge Computing</p>
                <p className={styles.creditText}>Dikembangkan oleh Tim Mahasiswa TRI dan TRPL UGM</p>
              </div>
            </div>
          </div>
          <Image className={styles.phoneSmall} src="/images/login-dashboard-phone.png" alt="Tampilan dashboard monitoring tangki air pada ponsel" width={425} height={371} priority />
          <Image className={styles.phoneLarge} src="/images/login-dashboard-phone-large.png" alt="Tampilan detail dashboard monitoring tangki air pada ponsel" width={663} height={558} priority />
        </section>

        <section className={styles.loginPanel} aria-labelledby="welcome-title">
          <div className={styles.formContent}>
            <div className={styles.intro}>
              <h1 id="welcome-title">Selamat Datang<br />Kembali</h1>
              <p>Silakan masuk untuk memantau status operasional pompa, kontrol histeresis, dan peringatan tangki air.</p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              {error && !rejectedCredentials && !rejectedPassword && (
                <div className={styles.error} role="alert">
                  <AlertCircle size={17} aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <div className={styles.field}>
                <label htmlFor="username">Username</label>
                <div className={`${styles.inputWrap} ${usernameError ? styles.invalidInput : ''}`}>
                  <Image src="/images/login-username-icon.png" alt="" width={23} height={23} />
                  <input ref={usernameRef} id="username" name="username" type="text" autoCapitalize="none" spellCheck={false} autoComplete="username" autoFocus required placeholder="Masukkan username" value={username}
                    aria-invalid={!!usernameError} aria-describedby={usernameError ? 'username-error' : focusedField === 'username' ? 'username-hint' : undefined}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => { setFocusedField(null); setTouched((fields) => ({ ...fields, username: true })); }}
                    onChange={(event) => { setUsername(event.target.value); clearError(); }} />
                </div>
                {usernameError ? <p id="username-error" className={styles.fieldError} role="alert">{usernameError}</p> : focusedField === 'username' && <p id="username-hint" className={styles.fieldHint}>Masukkan username akun Anda.</p>}
              </div>

              <div className={`${styles.field} ${styles.passwordField}`}>
                <label htmlFor="password">Password</label>
                <div className={`${styles.inputWrap} ${passwordError ? styles.invalidInput : ''}`}>
                  <Image src="/images/login-password-icon.svg" alt="" width={18} height={22} />
                  <input ref={passwordRef} id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required placeholder="Masukkan password" value={password}
                    aria-invalid={!!passwordError} aria-describedby={passwordError ? 'password-error' : focusedField === 'password' ? 'password-hint' : undefined}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => { setFocusedField(null); setTouched((fields) => ({ ...fields, password: true })); }}
                    onChange={(event) => { setPassword(event.target.value); clearError(); }} />
                  <button className={styles.visibilityButton} type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} aria-pressed={showPassword}>
                    {showPassword ? <EyeOff size={22} /> : <Image src="/images/login-eye-icon.svg" alt="" width={24} height={24} />}
                  </button>
                </div>
                {passwordError ? <p id="password-error" className={styles.fieldError} role="alert">{passwordError}</p> : focusedField === 'password' && <p id="password-hint" className={styles.fieldHint}>Masukkan password akun Anda.</p>}
              </div>

              <div className={styles.options}>
                <label className={styles.remember}>
                  <input
                    className={styles.checkbox}
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  Remember me
                </label>
                <button
                  className={styles.forgot}
                  type="button"
                  onClick={() => setInteractionNotice('Forgot Password belum dikonfigurasi untuk aplikasi ini.')}
                >
                  Forgot Password
                </button>
              </div>

              <button className={styles.submit} type="submit" disabled={isLoading}>
                {isLoading ? <><Loader2 size={18} className={styles.spinner} /> Memverifikasi...</> : 'SIGN IN'}
              </button>

              <div className={styles.alternatives}>
                <div className={styles.separator}><span />Or login with<span /></div>
                <button
                  className={styles.googleButton}
                  type="button"
                  onClick={() => setInteractionNotice('Google Sign-In belum dikonfigurasi untuk aplikasi ini.')}
                >
                  <Image src="/images/login-google-logo.svg" alt="Google" width={76} height={76} />
                </button>
              </div>

              <p className={styles.signup}>
                Don’t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setInteractionNotice('Sign up belum dikonfigurasi untuk aplikasi ini.')}
                >
                  Sign up
                </button>
              </p>
              {interactionNotice && <p className={styles.notice} role="status">{interactionNotice}</p>}
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className={styles.loading}><Loader2 size={30} className={styles.spinner} aria-label="Memuat halaman login" /></main>}>
      <LoginForm />
    </Suspense>
  );
}
