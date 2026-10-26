'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/context/auth-context';
import { localDb } from '@/lib/storage/local-db';
import { BusinessSettings, AuditLog } from '@/types';
import { formatDateTime } from '@/lib/format';
import {
  Store,
  Printer,
  CreditCard,
  Globe,
  CheckCircle2,
  History,
  AlertCircle,
  Database,
  Download,
  RotateCcw,
  Loader2,
} from 'lucide-react';

export default function SettingsPage() {
  const { isAdmin } = useAuth();

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'store' | 'data' | 'audit'>('store');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Form fields
  const [businessName, setBusinessName] = useState('Mango Nyeni');
  const [storeAddress, setStoreAddress] = useState('');
  const [receiptHeader, setReceiptHeader] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [enableCash, setEnableCash] = useState(true);
  const [enableQris, setEnableQris] = useState(true);
  const [enableTransfer, setEnableTransfer] = useState(true);
  const [instagramUrl, setInstagramUrl] = useState('');

  const fetchSettingsAndAudit = useCallback(() => {
    try {
      const db = localDb.getDb();
      const stData = db.business_settings;
      if (stData) {
        setBusinessName(stData.business_name || 'Mango Nyeni');
        setStoreAddress(stData.store_address || '');
        setReceiptHeader(stData.receipt_header || '');
        setReceiptFooter(stData.receipt_footer || '');
        setTimezone(stData.timezone || 'Asia/Jakarta');
        setEnableCash(stData.enable_cash ?? true);
        setEnableQris(stData.enable_qris ?? true);
        setEnableTransfer(stData.enable_transfer ?? true);
        setInstagramUrl(stData.instagram_url || '');
      }

      setAuditLogs([...db.audit_logs].reverse());
    } catch (err: unknown) {
      console.error('Settings error:', err);
    }
  }, []);

  useEffect(() => {
    fetchSettingsAndAudit();
  }, [fetchSettingsAndAudit]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');

    try {
      localDb.updateSettings({
        business_name: businessName.trim(),
        store_address: storeAddress.trim(),
        receipt_header: receiptHeader.trim(),
        receipt_footer: receiptFooter.trim(),
        timezone,
        enable_cash: enableCash,
        enable_qris: enableQris,
        enable_transfer: enableTransfer,
        instagram_url: instagramUrl.trim(),
      });

      setSaveMessage('Pengaturan bisnis berhasil disimpan.');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const db = localDb.getDb();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `NyeniPOS_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Reset to Default Seed
  const handleResetToDefault = () => {
    if (window.confirm('Reset seluruh data ke pengaturan awal poster Mango Nyeni? Seluruh transaksi dan pengeluaran baru akan dikembalikan ke kondisi default.')) {
      localDb.resetToDefault();
      fetchSettingsAndAudit();
      alert('Database berhasil direset ke data awal poster Mango Nyeni.');
    }
  };

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="p-8 text-center bg-white rounded-ios-card border border-border shadow-ios max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-foreground">Akses Terbatas</h2>
          <p className="text-xs text-muted mt-1">
            Halaman pengaturan sistem dan audit log hanya dapat diakses oleh Administrator.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Pengaturan Bisnis"
        subtitle="Konfigurasi identitas toko, format struk cetak, backup data mandiri, dan jejak audit"
      />

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-border pb-3 mb-6">
        <button
          onClick={() => setActiveTab('store')}
          className={`flex items-center gap-2 px-4 py-2 rounded-ios text-xs font-bold transition-all ${
            activeTab === 'store'
              ? 'bg-nyeni-navy text-white shadow-xs'
              : 'bg-white text-muted hover:text-foreground border border-border'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Pengaturan Toko & Struk</span>
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-2 px-4 py-2 rounded-ios text-xs font-bold transition-all ${
            activeTab === 'data'
              ? 'bg-nyeni-navy text-white shadow-xs'
              : 'bg-white text-muted hover:text-foreground border border-border'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Penyimpanan & Cadangan</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-ios text-xs font-bold transition-all ${
            activeTab === 'audit'
              ? 'bg-nyeni-navy text-white shadow-xs'
              : 'bg-white text-muted hover:text-foreground border border-border'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Jejak Audit ({auditLogs.length})</span>
        </button>
      </div>

      {activeTab === 'store' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
          {saveMessage && (
            <div className="p-4 rounded-ios bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveMessage}</span>
            </div>
          )}

          {/* Business Info */}
          <div className="bg-white p-5 sm:p-6 rounded-ios-card border border-border shadow-ios space-y-4">
            <h3 className="text-sm font-black text-nyeni-navy flex items-center gap-2 pb-3 border-b border-slate-100">
              <Store className="w-4 h-4 text-nyeni-blue" />
              <span>Identitas Usaha</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1.5">
                  Nama Bisnis / Brand
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-ios border border-border font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1.5">
                  Zona Waktu Operasional
                </label>
                <input
                  type="text"
                  disabled
                  value={`${timezone} (WIB)`}
                  className="w-full px-3 py-2 text-xs rounded-ios border border-slate-200 bg-slate-100 text-muted cursor-not-allowed font-medium"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-semibold text-foreground mb-1.5">
                Alamat Outlet / Toko
              </label>
              <textarea
                rows={2}
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Jl. Raya Mangga No. 88, Jakarta"
                className="w-full px-3 py-2 text-xs rounded-ios border border-border focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
              />
            </div>

            <div className="text-xs">
              <label className="block font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-pink-600" />
                <span>URL Instagram Resmi (Opsional)</span>
              </label>
              <input
                type="text"
                placeholder="https://instagram.com/mangonyeni (Boleh kosong)"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-ios border border-border focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
              />
              <p className="text-[11px] text-muted mt-1">
                Field dibiarkan kosong sampai pemilik mengisi akun Instagram resmi yang aktif.
              </p>
            </div>
          </div>

          {/* Receipt Settings */}
          <div className="bg-white p-5 sm:p-6 rounded-ios-card border border-border shadow-ios space-y-4">
            <h3 className="text-sm font-black text-nyeni-navy flex items-center gap-2 pb-3 border-b border-slate-100">
              <Printer className="w-4 h-4 text-nyeni-blue" />
              <span>Format Struk Kasir (Thermal)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1.5">
                  Pesan Header Struk
                </label>
                <input
                  type="text"
                  value={receiptHeader}
                  onChange={(e) => setReceiptHeader(e.target.value)}
                  placeholder="Sensasi Dessert Sago Asli & Creamy!"
                  className="w-full px-3 py-2 text-xs rounded-ios border border-border focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1.5">
                  Pesan Footer / Penutup Struk
                </label>
                <input
                  type="text"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  placeholder="Terima kasih telah menikmati Mango Nyeni!"
                  className="w-full px-3 py-2 text-xs rounded-ios border border-border focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Settings */}
          <div className="bg-white p-5 sm:p-6 rounded-ios-card border border-border shadow-ios space-y-4">
            <h3 className="text-sm font-black text-nyeni-navy flex items-center gap-2 pb-3 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-nyeni-blue" />
              <span>Metode Pembayaran Kasir</span>
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-3 p-3 rounded-ios border border-slate-100 bg-slate-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableCash}
                  onChange={(e) => setEnableCash(e.target.checked)}
                  className="w-4 h-4 text-nyeni-blue rounded"
                />
                <div>
                  <span className="font-bold text-foreground block">Pembayaran Tunai (Cash)</span>
                  <span className="text-muted text-[11px]">
                    Kasir memasukkan uang diterima dan kembalian dihitung otomatis.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-ios border border-slate-100 bg-slate-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableQris}
                  onChange={(e) => setEnableQris(e.target.checked)}
                  className="w-4 h-4 text-nyeni-blue rounded"
                />
                <div>
                  <span className="font-bold text-foreground block">Pembayaran QRIS</span>
                  <span className="text-muted text-[11px]">
                    Tampilkan barcode QRIS resmi untuk dipindai oleh pelanggan.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-ios border border-slate-100 bg-slate-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTransfer}
                  onChange={(e) => setEnableTransfer(e.target.checked)}
                  className="w-4 h-4 text-nyeni-blue rounded"
                />
                <div>
                  <span className="font-bold text-foreground block">Transfer Bank</span>
                  <span className="text-muted text-[11px]">
                    Instruksi nomor rekening resmi operasional Mango Nyeni.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 min-h-[46px] rounded-ios bg-nyeni-navy text-white font-bold text-sm hover:bg-nyeni-navy-hover transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'data' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white p-6 rounded-ios-card border border-border shadow-ios space-y-4">
            <div>
              <h3 className="text-base font-bold text-nyeni-navy">Penyimpanan Mandiri (Client-Side Storage)</h3>
              <p className="text-xs text-muted mt-1">
                Aplikasi beroperasi secara mandiri menggunakan penyimpanan lokal browser yang persisten. Tidak memerlukan setup server atau database cloud eksternal.
              </p>
            </div>

            <div className="p-4 rounded-ios bg-nyeni-blue-soft/50 border border-nyeni-blue/20 text-xs text-nyeni-navy space-y-2">
              <p className="font-bold">Keunggulan Standalone Mode:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                <li>Langsung aktif dan siap dipakai detik pertama kali dibuka.</li>
                <li>Dapat digunakan offline tanpa koneksi internet (PWA).</li>
                <li>Data tetap tersimpan aman di perangkat meskipun browser ditutup.</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex-1 py-3 px-4 rounded-ios bg-nyeni-blue text-white font-bold text-xs hover:bg-nyeni-blue-hover transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Cadangan Database (.json)</span>
              </button>

              <button
                type="button"
                onClick={handleResetToDefault}
                className="py-3 px-4 rounded-ios border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset ke Data Awal Poster</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white rounded-ios-card border border-border shadow-ios overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-bold text-nyeni-navy">Aktivitas Sensitif & Audit Log</h3>
            <p className="text-xs text-muted">Jejak pembatalan transaksi, perubahan harga, dan penyesuaian stok</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-border text-muted uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Petugas (Actor)</th>
                  <th className="px-4 py-3">Aksi</th>
                  <th className="px-4 py-3">Entitas</th>
                  <th className="px-4 py-3">Alasan / Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-xs text-muted">
                      Belum ada catatan audit.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-muted whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="px-4 py-3 font-bold text-foreground">
                        {log.actor?.full_name || 'Admin'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-nyeni-blue uppercase text-[10px] px-2 py-0.5 rounded bg-nyeni-blue-soft">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted capitalize">
                        {log.entity_type} {log.entity_id ? `#${log.entity_id.substring(0, 8)}` : ''}
                      </td>
                      <td className="px-4 py-3 text-foreground max-w-sm truncate">
                        {log.reason || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
