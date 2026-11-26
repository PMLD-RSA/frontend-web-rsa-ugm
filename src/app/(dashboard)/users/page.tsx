"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  LuDownload as Download,
  LuEye as Eye,
  LuPencil as Pencil,
  LuPlus as Plus,
  LuRefreshCw as RefreshCw,
  LuSettings as BreadcrumbIcon,
  LuSearch as Search,
  LuSlidersHorizontal as SlidersHorizontal,
  LuTrash2 as Trash2,
  LuX as X,
} from "react-icons/lu";
import { downloadCsv } from "@/lib/downloadCsv";
import { NotificationPopover } from "@/components/dashboard/NotificationPopover";
import { isAdmin, useAuthStore } from "@/stores/authStore";
import type { ApiResponse, User, UserRole } from "@/types";
import styles from "./users.module.css";

export default function UsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const canManageUsers = isAdmin(currentUser);
  const [users, setUsers] = useState<User[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "forbidden" | "error">("loading");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [detail, setDetail] = useState<User | null>(null);

  // CRUD Modal States
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form fields
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("operator");

  const [editRole, setEditRole] = useState<UserRole>("operator");
  const [editActive, setEditActive] = useState(true);
  const [editPassword, setEditPassword] = useState("");

  async function loadUsers(signal?: AbortSignal) {
    try {
      const response = await fetch("/api/users", { signal });
      if (response.status === 403) {
        setUsers([]);
        setState("forbidden");
        return;
      }
      const result: ApiResponse<User[]> = await response.json();
      if (!response.ok || !result.success || !Array.isArray(result.data)) {
        throw new Error();
      }
      setUsers(result.data);
      setUpdated(new Date());
      setState("ready");
    } catch {
      if (!signal?.aborted) setState("error");
    }
  }

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function fetchUsers() {
      try {
        const response = await fetch("/api/users", { signal: controller.signal });
        if (response.status === 403) {
          if (!ignore) {
            setUsers([]);
            setState("forbidden");
          }
          return;
        }
        const result: ApiResponse<User[]> = await response.json();
        if (!ignore) {
          if (!response.ok || !result.success || !Array.isArray(result.data)) {
            throw new Error();
          }
          setUsers(result.data);
          setUpdated(new Date());
          setState("ready");
        }
      } catch {
        if (!ignore) setState("error");
      }
    }

    void fetchUsers();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const anyModalOpen = Boolean(detail || createOpen || editingUser || deletingUser);
    if (!anyModalOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || submitting) return;
      if (deletingUser) setDeletingUser(null);
      else if (editingUser) setEditingUser(null);
      else if (createOpen) setCreateOpen(false);
      else if (detail) setDetail(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detail, createOpen, editingUser, deletingUser, submitting]);

  function openCreateModal() {
    setNewUsername("");
    setNewPassword("");
    setNewRole("operator");
    setFormError("");
    setCreateOpen(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setEditRole(user.role);
    setEditActive(user.isActive);
    setEditPassword("");
    setFormError("");
  }

  function openDeleteModal(user: User) {
    setDeletingUser(user);
    setFormError("");
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedUsername = newUsername.trim();
    if (trimmedUsername.length < 3) {
      setFormError("Username minimal 3 karakter.");
      return;
    }
    if (newPassword.length < 6) {
      setFormError("Password minimal 6 karakter.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: trimmedUsername,
          password: newPassword,
          role: newRole,
        }),
      });
      const result: ApiResponse<User> = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal membuat pengguna baru.");
      }
      setCreateOpen(false);
      await loadUsers();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Gagal membuat pengguna baru.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUser) return;

    const payload: { role: UserRole; isActive: boolean; password?: string } = {
      role: editRole,
      isActive: editActive,
    };
    if (editPassword.trim()) {
      if (editPassword.trim().length < 6) {
        setFormError("Password baru minimal 6 karakter.");
        return;
      }
      payload.password = editPassword.trim();
    }

    setSubmitting(true);
    setFormError("");
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(editingUser.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: ApiResponse<User> = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal memperbarui pengguna.");
      }
      setEditingUser(null);
      await loadUsers();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Gagal memperbarui pengguna.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteUser() {
    if (!deletingUser) return;
    setSubmitting(true);
    setFormError("");
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(deletingUser.id)}`, {
        method: "DELETE",
      });
      const result: ApiResponse<unknown> = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menghapus pengguna.");
      }
      setDeletingUser(null);
      await loadUsers();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Gagal menghapus pengguna.");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(
    () =>
      users.filter(
        (user) =>
          user.username.toLowerCase().includes(query.toLowerCase()) &&
          (!role || user.role === role)
      ),
    [users, query, role]
  );

  const pageSize = showAll ? Math.max(1, filtered.length) : 8;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const rows = showAll
    ? filtered
    : filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  function download() {
    downloadCsv("users.csv", [
      ["No", "Username", "Role", "Status", "Tanggal dibuat"],
      ...users.map((user, idx) => [
        idx + 1,
        user.username,
        user.role,
        user.isActive ? "Active" : "Inactive",
        user.createdAt ?? "",
      ]),
    ]);
  }

  return (
    <section className={styles.page}>
      {/* Consistent Header: Title & Action Buttons */}
      <header className={styles.header}>
        <h1>User roles</h1>
        <div className={styles.headerActions}>
          <NotificationPopover className={styles.notification} iconSize={23} />
          <button
            type="button"
            className={styles.download}
            disabled={state !== "ready" || !users.length}
            onClick={download}
          >
            <Download size={18} />
            Download All
          </button>
        </div>
      </header>

      {/* Consistent Breadcrumb */}
      <div className={`${styles.breadcrumb} app-breadcrumb`}>
        <span>
          <BreadcrumbIcon size={16} aria-hidden="true" /><Link href="/">Dashboard</Link> &gt; Users
        </span>
        <span>
          {updated &&
            `Updated ${updated.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })} · `}
          <button
            type="button"
            onClick={() => {
              setState("loading");
              void loadUsers();
            }}
            disabled={state === "loading"}
          >
            <RefreshCw size={13} /> Reload
          </button>
        </span>
      </div>

      {/* Toolbar: Quick Actions */}
      <div className={styles.toolbar}>
        <h2>Quick Actions</h2>
        <div className={styles.toolbarActions}>
          <div className="app-search">
            <Search size={16} aria-hidden="true" />
            <input
              aria-label="Cari pengguna"
              placeholder="Search users..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <button
            type="button"
            className={styles.filterBtn}
            aria-expanded={filterOpen}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <SlidersHorizontal size={14} />
            Filter
          </button>
          <button
            type="button"
            className={styles.addUserBtn}
            disabled={!canManageUsers || state === "forbidden"}
            title={
              canManageUsers
                ? "Tambah pengguna baru"
                : "Hanya admin yang dapat menambah pengguna baru"
            }
            onClick={openCreateModal}
          >
            <Plus size={16} />
            Add New User
          </button>
        </div>
      </div>

      {filterOpen && (
        <div className={styles.filterRow}>
          <label htmlFor="user-role-filter" style={{ fontSize: "13px", fontWeight: 600 }}>
            Role:
          </label>
          <select
            id="user-role-filter"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Semua role</option>
            <option value="admin">Admin</option>
            <option value="operator">Operator</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      )}

      {/* 4 Summary Cards (User log.png) */}
      <div className={styles.summary}>
        <div>
          <span>All members</span>
          <strong>{state === "ready" ? users.length : "—"}</strong>
          <small>&nearr; vs 2 last period</small>
        </div>
        <div>
          <span>Active members</span>
          <strong>
            {state === "ready" ? users.filter((u) => u.isActive).length : "—"}
          </strong>
          <small>&nearr; vs 2 last period</small>
        </div>
        <div>
          <span>Pending invitations</span>
          <strong>0</strong>
          <small className={styles.muted}>last invitation: -</small>
        </div>
        <div>
          <span>Expired invitations</span>
          <strong>0</strong>
          <small className={styles.muted}>last expired: -</small>
        </div>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Activity</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((user, index) => {
                  const userIndex = (showAll ? 0 : currentPage * pageSize) + index + 1;
                  const initials = user.username.slice(0, 2).toUpperCase();
                  const fakeEmail = `${user.username.toLowerCase()}@ugm.ac.id`;
                  const lastActivity = user.createdAt
                    ? new Date(user.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    : "Belum pernah aktif";

                  return (
                    <tr key={user.id}>
                      <td className={styles.noCell}>
                        {String(userIndex).padStart(3, "0")}
                      </td>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.avatar}>{initials}</div>
                          <div className={styles.userDetails}>
                            <div className={styles.userNameRow}>
                              <strong>{user.username}</strong>
                              {currentUser?.id === user.id && (
                                <span className={styles.youBadge}>You</span>
                              )}
                            </div>
                            <span className={styles.userEmail}>{fakeEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td className={styles.roleText}>{user.role}</td>
                      <td>
                        <span
                          className={`${styles.statusPill} ${
                            !user.isActive ? styles.inactive : ""
                          }`}
                        >
                          <i
                            className={`${styles.statusIndicator} ${
                              !user.isActive ? styles.inactive : ""
                            }`}
                          />
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className={styles.timeText}>{lastActivity}</td>
                      <td>
                        <div className={styles.actionGroup}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            aria-label={`Detail ${user.username}`}
                            title="Detail pengguna"
                            onClick={() => setDetail(user)}
                          >
                            <Eye size={17} />
                          </button>
                          {canManageUsers && (
                            <>
                              <button
                                type="button"
                                className={styles.actionBtn}
                                aria-label={`Edit ${user.username}`}
                                title="Edit role, status, atau reset password"
                                onClick={() => openEditModal(user)}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                aria-label={`Hapus ${user.username}`}
                                title={
                                  currentUser?.id === user.id
                                    ? "Tidak dapat menghapus akun yang sedang digunakan"
                                    : "Hapus pengguna"
                                }
                                disabled={currentUser?.id === user.id}
                                onClick={() => openDeleteModal(user)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className={styles.emptyMessage}>
                    {state === "loading"
                      ? "Memuat data pengguna..."
                      : state === "forbidden"
                      ? "Akses terbatas: halaman manajemen pengguna hanya tersedia untuk role Admin."
                      : state === "error"
                      ? "Daftar pengguna tidak tersedia. Periksa koneksi backend."
                      : "Tidak ada pengguna yang sesuai dengan pencarian."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: Pagination */}
        <footer className={styles.footer}>
          <div className={styles.pagination}>
            <button
              type="button"
              disabled={currentPage === 0 || showAll}
              onClick={() => setPage(currentPage - 1)}
              aria-label="Halaman sebelumnya"
            >
              &lt;
            </button>
            {Array.from({ length: pages }, (_, i) => i)
              .filter((i) => Math.abs(i - currentPage) <= 1)
              .map((i) => (
                <button
                  key={i}
                  type="button"
                  aria-current={currentPage === i ? "page" : undefined}
                  disabled={showAll}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}
            <button
              type="button"
              disabled={currentPage >= pages - 1 || showAll}
              onClick={() => setPage(currentPage + 1)}
              aria-label="Halaman berikutnya"
            >
              &gt;
            </button>
          </div>

          <div className={styles.footerRight}>
            <span>
              Showing {rows.length ? (showAll ? 1 : currentPage * pageSize + 1) : 0} to{" "}
              {showAll ? filtered.length : Math.min((currentPage + 1) * pageSize, filtered.length)}{" "}
              of {filtered.length} entries
            </span>
            <button
              type="button"
              className={styles.btnShowAll}
              onClick={() => {
                setShowAll(!showAll);
                setPage(0);
              }}
            >
              {showAll ? "Paginate" : "Show All"}
            </button>
          </div>
        </footer>
      </div>

      {/* User Detail Dialog */}
      {detail && (
        <div className={styles.modalOverlay} onClick={() => setDetail(null)}>
          <div
            className={styles.dialogBox}
            role="dialog"
            aria-modal="true"
            aria-label={`Detail Pengguna ${detail.username}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.dialogClose}
              onClick={() => setDetail(null)}
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 12px" }}>
              Detail Pengguna: {detail.username}
            </h3>
            <p style={{ margin: "6px 0", fontSize: "13px" }}>
              <strong>Role:</strong> {detail.role}
            </p>
            <p style={{ margin: "6px 0", fontSize: "13px" }}>
              <strong>Status:</strong> {detail.isActive ? "Aktif" : "Nonaktif"}
            </p>
            <p style={{ margin: "6px 0", fontSize: "13px" }}>
              <strong>Dibuat:</strong>{" "}
              {detail.createdAt
                ? new Date(detail.createdAt).toLocaleString("id-ID")
                : "Belum tersedia"}
            </p>
          </div>
        </div>
      )}

      {/* Create User Dialog */}
      {createOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => !submitting && setCreateOpen(false)}
        >
          <div
            className={styles.dialogBox}
            role="dialog"
            aria-modal="true"
            aria-label="Tambah Pengguna Baru"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.dialogClose}
              onClick={() => !submitting && setCreateOpen(false)}
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 16px" }}>
              Tambah Pengguna Baru
            </h3>
            <form onSubmit={handleCreateUser}>
              <div className={styles.formGroup}>
                <label htmlFor="create-username">Username</label>
                <input
                  id="create-username"
                  type="text"
                  required
                  minLength={3}
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Contoh: operator1"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="create-password">Password Awal</label>
                <input
                  id="create-password"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="create-role">Role</label>
                <select
                  id="create-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                >
                  <option value="admin">Admin</option>
                  <option value="operator">Operator</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              {formError && <p className={styles.formError}>{formError}</p>}
              <div className={styles.dialogActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  disabled={submitting}
                  onClick={() => setCreateOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={submitting}
                >
                  {submitting ? "Menyimpan..." : "Simpan Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Dialog */}
      {editingUser && (
        <div
          className={styles.modalOverlay}
          onClick={() => !submitting && setEditingUser(null)}
        >
          <div
            className={styles.dialogBox}
            role="dialog"
            aria-modal="true"
            aria-label={`Edit Pengguna ${editingUser.username}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.dialogClose}
              onClick={() => !submitting && setEditingUser(null)}
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 16px" }}>
              Edit Pengguna: {editingUser.username}
            </h3>
            <form onSubmit={handleUpdateUser}>
              <div className={styles.formGroup}>
                <label htmlFor="edit-role">Role</label>
                <select
                  id="edit-role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                >
                  <option value="admin">Admin</option>
                  <option value="operator">Operator</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                />
                <span>Akun Aktif</span>
              </label>
              <div className={styles.formGroup}>
                <label htmlFor="edit-password">Reset Password (Opsional)</label>
                <input
                  id="edit-password"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Kosongkan jika tidak ingin mengubah password"
                />
              </div>
              {formError && <p className={styles.formError}>{formError}</p>}
              <div className={styles.dialogActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  disabled={submitting}
                  onClick={() => setEditingUser(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={submitting}
                >
                  {submitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Dialog */}
      {deletingUser && (
        <div
          className={styles.modalOverlay}
          onClick={() => !submitting && setDeletingUser(null)}
        >
          <div
            className={styles.dialogBox}
            role="dialog"
            aria-modal="true"
            aria-label={`Hapus Pengguna ${deletingUser.username}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.dialogClose}
              onClick={() => !submitting && setDeletingUser(null)}
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 10px" }}>
              Hapus Pengguna
            </h3>
            <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#475569" }}>
              Apakah Anda yakin ingin menghapus akun{" "}
              <strong>{deletingUser.username}</strong> ({deletingUser.role})?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            {formError && <p className={styles.formError}>{formError}</p>}
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                disabled={submitting}
                onClick={() => setDeletingUser(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className={styles.btnDanger}
                disabled={submitting}
                onClick={handleDeleteUser}
              >
                {submitting ? "Menghapus..." : "Hapus Akun"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}