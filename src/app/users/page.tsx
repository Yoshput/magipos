'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAuth } from '@/context/auth-context';
import { localDb } from '@/lib/storage/local-db';
import { Profile, UserRole } from '@/types';
import { formatDate } from '@/lib/format';
import {
  UserPlus,
  Shield,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function UsersPage() {
  const { isAdmin, profile: currentProfile } = useAuth();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Invite Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const fetchUsers = useCallback(() => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const db = localDb.getDb();
      setProfiles([...db.profiles].reverse());
    } catch (err: unknown) {
      console.error('Users error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat daftar pengguna.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Toggle user active status
  const handleToggleActive = (targetProfile: Profile) => {
    if (targetProfile.id === currentProfile?.id) {
      alert('Anda tidak dapat menonaktifkan akun Anda sendiri.');
      return;
    }

    const nextState = !targetProfile.is_active;
    const confirmMsg = nextState
      ? `Aktifkan kembali akun ${targetProfile.full_name}?`
      : `Nonaktifkan akun ${targetProfile.full_name}? Pengguna ini tidak akan bisa login ke sistem.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      localDb.toggleUserActive(targetProfile.id);
      fetchUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal mengubah status pengguna.');
    }
  };

  // Create User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      setModalError('Seluruh kolom wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setModalError('');
    setModalSuccess('');

    try {
      localDb.createUser(fullName.trim(), email.trim(), password, role);

      setModalSuccess('Pengguna berhasil dibuat dan dapat langsung login.');
      fetchUsers();
      setTimeout(() => {
        setIsModalOpen(false);
        setFullName('');
        setEmail('');
        setPassword('');
        setModalSuccess('');
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat pengguna.';
      setModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="p-8 text-center bg-white rounded-ios-card border border-border shadow-ios max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-foreground">Akses Terbatas</h2>
          <p className="text-xs text-muted mt-1">
            Hanya Admin yang memiliki hak akses untuk mengelola akun pengguna sistem.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Manajemen Pengguna"
        subtitle="Kelola akun kasir dan admin operasional Mango Nyeni"
        action={
          <button
            onClick={() => {
              setIsModalOpen(true);
              setFullName('');
              setEmail('');
              setPassword('');
              setModalError('');
              setModalSuccess('');
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-ios bg-nyeni-blue text-white font-bold text-xs hover:bg-nyeni-blue-hover transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna Baru</span>
          </button>
        }
      />

      {isLoading ? (
        <LoadingSkeleton count={4} className="h-16 w-full" />
      ) : errorMessage ? (
        <ErrorState message={errorMessage} onRetry={fetchUsers} />
      ) : (
        <div className="bg-white rounded-ios-card border border-border shadow-ios overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-border text-muted uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Nama Lengkap</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Peran (Role)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Terdaftar Sejak</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-foreground">
                      {p.full_name}
                      {p.id === currentProfile?.id && (
                        <span className="ml-1.5 text-[10px] text-nyeni-blue bg-nyeni-blue-soft px-1.5 py-0.5 rounded font-bold">
                          (Anda)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-muted">{p.email || '-'}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 font-bold capitalize text-xs ${
                          p.role === 'admin' ? 'text-amber-700' : 'text-nyeni-blue'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>{p.role}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge
                        label={p.is_active ? 'Aktif' : 'Nonaktif'}
                        variant={p.is_active ? 'success' : 'muted'}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-muted whitespace-nowrap">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {p.id !== currentProfile?.id && (
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p)}
                          className={`px-3 py-1 rounded-ios font-bold text-[11px] transition-colors ${
                            p.is_active
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {p.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-ios-card shadow-ios-modal border border-border overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold text-nyeni-navy">Tambah Akun Pengguna</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-muted hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-4 sm:p-5 space-y-3.5 text-xs">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-ios text-rose-700 font-medium">
                  {modalError}
                </div>
              )}
              {modalSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-ios text-emerald-700 font-medium">
                  {modalSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rina Kasir"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-ios border border-border focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Email Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="kasir1@mangonyeni.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-ios border border-border focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Password Awal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-ios border border-border focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Peran / Izin (Role) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('cashier')}
                    className={`py-2 rounded-ios border font-bold text-center transition-all ${
                      role === 'cashier'
                        ? 'border-nyeni-blue bg-nyeni-blue-soft text-nyeni-blue shadow-xs'
                        : 'border-border bg-white text-muted hover:bg-slate-50'
                    }`}
                  >
                    Kasir (POS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-2 rounded-ios border font-bold text-center transition-all ${
                      role === 'admin'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-xs'
                        : 'border-border bg-white text-muted hover:bg-slate-50'
                    }`}
                  >
                    Administrator
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-ios border border-border text-foreground hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-ios bg-nyeni-navy text-white font-bold hover:bg-nyeni-navy-hover transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Membuat Akun...</span>
                    </>
                  ) : (
                    <span>Buat Pengguna</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
