import { ReactNode } from "react";

/**
 * Layout untuk route group (auth).
 * Halaman login tidak menggunakan Sidebar/Header dashboard —
 * hanya menampilkan konten login secara full-screen centered.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a354c] via-[#0d4a6e] to-[#0a354c] flex items-center justify-center p-4">
      {children}
    </div>
  );
}
