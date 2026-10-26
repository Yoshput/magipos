// Financial Reports Export Module (Excel .xlsx & PDF)
// NyeniPOS — Mango Nyeni Operational & POS System

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { formatRupiah, formatNumber } from './format';

export interface ReportExportData {
  periodLabel: string;
  startDate: string;
  endDate: string;
  metrics: {
    grossSales: number;
    totalDiscounts: number;
    netSales: number;
    estimatedCOGS: number;
    estimatedGrossProfit: number;
    operationalExpenses: number;
    estimatedOperatingProfit: number;
    cashInflow: number;
    paidStockPurchases: number;
    operationalExpensesPaid: number;
    netCashFlow: number;
  };
  sales: any[];
  expenses: any[];
  purchases: any[];
  ingredientsUsage: any[];
  topProducts?: any[];
}

/**
 * EXPORT KE EXCEL (.xlsx)
 * Menghasilkan multi-sheet workbook profesional:
 * 1. Ringkasan Finansial & Arus Kas
 * 2. Rincian Penjualan
 * 3. Beban Operasional
 * 4. Pembelian Stok Bahan
 * 5. Konsumsi Bahan Baku
 */
export function exportToExcel(data: ReportExportData): void {
  const wb = XLSX.utils.book_new();

  // --- SHEET 1: RINGKASAN LABA RUGI & ARUS KAS ---
  const summaryRows = [
    ['MANGO NYENI — NYENIPOS'],
    ['LAPORAN KEUANGAN & ARUS KAS TERPADU'],
    [`Periode: ${data.periodLabel} (${data.startDate} s/d ${data.endDate})`],
    [`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`],
    [],
    ['METRIK LABA RUGI ESTIMASI', 'NILAI (IDR)', 'STATUS'],
    ['Omzet Kotor (Gross Sales)', data.metrics.grossSales, 'Pendapatan'],
    ['Potongan Diskon Penjualan', data.metrics.totalDiscounts, 'Pengurang'],
    ['Omzet Bersih (Net Revenue)', data.metrics.netSales, 'Pendapatan Bersih'],
    ['HPP / Biaya Bahan Baku Terpakai (COGS)', data.metrics.estimatedCOGS, 'Harga Pokok'],
    ['Laba Kotor Estimasi', data.metrics.estimatedGrossProfit, 'Gross Profit'],
    ['Beban Operasional Toko', data.metrics.operationalExpenses, 'Biaya Rutin'],
    ['Laba Operasional Estimasi', data.metrics.estimatedOperatingProfit, data.metrics.estimatedOperatingProfit >= 0 ? 'Surplus' : 'Defisit'],
    [],
    ['METRIK ARUS KAS NYATA (CASH FLOW)', 'NILAI (IDR)', 'KETERANGAN'],
    ['Kas Masuk Penjualan (Cash/QRIS/TF)', data.metrics.cashInflow, 'Arus Masuk'],
    ['Kas Keluar Pembelian Stok Lunas', data.metrics.paidStockPurchases, 'Arus Keluar Stok'],
    ['Kas Keluar Beban Operasional Lunas', data.metrics.operationalExpensesPaid, 'Arus Keluar Operasional'],
    ['Arus Kas Bersih (Net Cash Flow)', data.metrics.netCashFlow, data.metrics.netCashFlow >= 0 ? 'Kas Surplus' : 'Kas Defisit'],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Finansial');

  // --- SHEET 2: RINCIAN PENJUALAN ---
  const salesHeaders = [
    'No. Struk',
    'Tanggal & Waktu',
    'Petugas Kasir',
    'Metode Pembayaran',
    'Ref QRIS / Bank',
    'Subtotal (IDR)',
    'Diskon (IDR)',
    'Total (IDR)',
    'HPP (IDR)',
    'Status',
  ];
  const salesRows = data.sales.map((s) => [
    s.receipt_number,
    new Date(s.created_at).toLocaleString('id-ID'),
    s.cashier?.full_name || 'Kasir',
    s.payment_method?.toUpperCase(),
    s.qris_reference || '-',
    s.subtotal_idr,
    s.discount_idr,
    s.total_idr,
    s.total_cogs_idr,
    s.status === 'void' ? 'VOID (BATAL)' : 'LUNAS',
  ]);
  const wsSales = XLSX.utils.aoa_to_sheet([salesHeaders, ...salesRows]);
  XLSX.utils.book_append_sheet(wb, wsSales, 'Rincian Penjualan');

  // --- SHEET 3: PENGELUARAN OPERASIONAL ---
  const expHeaders = ['Tanggal', 'Kategori', 'Keterangan Pengeluaran', 'Nominal (IDR)', 'Status'];
  const expRows = data.expenses.map((e) => [
    e.expense_date,
    e.category,
    e.description,
    e.amount_idr,
    e.status === 'void' ? 'DIBATALKAN' : 'AKTIF',
  ]);
  const wsExpenses = XLSX.utils.aoa_to_sheet([expHeaders, ...expRows]);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Beban Operasional');

  // --- SHEET 4: RESTOCK / PEMBELIAN BAHAN ---
  const poHeaders = ['No. Faktur', 'Tanggal', 'Supplier / Pemasok', 'Status Bayar', 'Total Tagihan (IDR)'];
  const poRows = data.purchases.map((p) => [
    p.purchase_number,
    p.purchase_date,
    p.supplier_name || 'Umum',
    p.payment_status === 'paid' ? 'LUNAS' : 'TEMPO',
    p.total_amount_idr,
  ]);
  const wsPurchases = XLSX.utils.aoa_to_sheet([poHeaders, ...poRows]);
  XLSX.utils.book_append_sheet(wb, wsPurchases, 'Pembelian Stok');

  // --- SHEET 5: KONSUMSI BAHAN BAKU ---
  const ingHeaders = ['Nama Bahan Baku', 'Total Terpakai', 'Satuan Dasar', 'Estimasi Nilai HPP (IDR)'];
  const ingRows = data.ingredientsUsage.map((i) => [
    i.name,
    i.total_used,
    i.base_unit,
    i.estimated_cost,
  ]);
  const wsIngredients = XLSX.utils.aoa_to_sheet([ingHeaders, ...ingRows]);
  XLSX.utils.book_append_sheet(wb, wsIngredients, 'Konsumsi Bahan Baku');

  // Trigger download
  const fileName = `Laporan-Keuangan-MangoNyeni-${data.startDate}-sd-${data.endDate}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * EXPORT KE DOKUMEN PDF (.pdf)
 * Menghasilkan invoice/statement keuangan resmi dengan jsPDF
 */
export function exportToPdf(data: ReportExportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [20, 42, 114]; // #142A72 Navy
  const secondaryColor: [number, number, number] = [23, 105, 232]; // #1769E8 Blue
  const grayColor: [number, number, number] = [100, 116, 139];

  let y = 18;

  // Header Bisnis
  doc.setFillColor(...primaryColor);
  doc.rect(14, y, 182, 18, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('MANGO NYENI — NYENIPOS', 20, y + 8);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('LAPORAN KINERJA KEUANGAN & ARUS KAS OPERASIONAL', 20, y + 14);

  y += 26;

  // Metadata Periode
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Periode Laporan: ${data.periodLabel}`, 14, y);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text(`Rentang Tanggal: ${data.startDate} s/d ${data.endDate} | Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, y + 5);

  y += 12;

  // Garis Pemisah
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, y, 196, y);

  y += 6;

  // KOTAK RINGKASAN KPI (4 Kotak)
  const boxWidth = 43;
  const boxHeight = 22;

  const kpis = [
    { label: 'OMZET BERSIH', value: formatRupiah(data.metrics.netSales), color: secondaryColor },
    { label: 'TOTAL HPP BAHAN', value: formatRupiah(data.metrics.estimatedCOGS), color: [217, 119, 6] as [number, number, number] },
    { label: 'LABA OPERASIONAL', value: formatRupiah(data.metrics.estimatedOperatingProfit), color: [16, 185, 129] as [number, number, number] },
    { label: 'ARUS KAS BERSIH', value: formatRupiah(data.metrics.netCashFlow), color: primaryColor },
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (boxWidth + 3.3);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'S');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...kpi.color);
    doc.text(kpi.label, x + 3.5, y + 6);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, x + 3.5, y + 15);
  });

  y += boxHeight + 10;

  // SECTION 1: RINCIAN LABA RUGI & ARUS KAS (Tabel 2 Kolom)
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('1. Ringkasan Laba Rugi & Arus Kas Terpisah', 14, y);
  y += 5;

  const tableRows = [
    ['(+) Omzet Penjualan Kotor (Gross Sales)', formatRupiah(data.metrics.grossSales)],
    ['(-) Diskon Promosi Penjualan', `(${formatRupiah(data.metrics.totalDiscounts)})`],
    ['(=) Omzet Penjualan Bersih', formatRupiah(data.metrics.netSales)],
    ['(-) HPP Bahan Baku Terpakai (COGS)', `(${formatRupiah(data.metrics.estimatedCOGS)})`],
    ['(=) Laba Kotor Operasional Estimasi', formatRupiah(data.metrics.estimatedGrossProfit)],
    ['(-) Beban Biaya Operasional Toko', `(${formatRupiah(data.metrics.operationalExpenses)})`],
    ['(=) Laba Bersih Operasional Estimasi', formatRupiah(data.metrics.estimatedOperatingProfit)],
    ['--- ARUS KAS NYATA ---', '----------------'],
    ['(+) Arus Kas Masuk Penjualan (Real Inflow)', formatRupiah(data.metrics.cashInflow)],
    ['(-) Kas Keluar Pembelian Stok Lunas', `(${formatRupiah(data.metrics.paidStockPurchases)})`],
    ['(-) Kas Keluar Beban Operasional Lunas', `(${formatRupiah(data.metrics.operationalExpensesPaid)})`],
    ['(=) Arus Kas Bersih (Net Cash Flow)', formatRupiah(data.metrics.netCashFlow)],
  ];

  doc.setFontSize(8.5);
  tableRows.forEach(([label, val], idx) => {
    const isHeader = label.includes('---');
    const isTotal = label.includes('(=)');

    if (isHeader) {
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y - 3.5, 182, 5.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
    } else if (isTotal) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
    }

    doc.text(label, 16, y);
    doc.text(val, 194, y, { align: 'right' });
    y += 5;
  });

  y += 5;

  // SECTION 2: KONSUMSI BAHAN BAKU TERBESAR
  if (data.ingredientsUsage.length > 0 && y < 240) {
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('2. Rekap Pemakaian Bahan Baku Utama', 14, y);
    y += 5;

    // Header Tabel
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 3.5, 182, 5.5, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('NAMA BAHAN BAKU', 16, y);
    doc.text('TOTAL TERPAKAI', 120, y);
    doc.text('ESTIMASI NILAI HPP', 194, y, { align: 'right' });
    y += 5.5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    data.ingredientsUsage.slice(0, 8).forEach((ing) => {
      if (y > 275) return;
      doc.text(ing.name, 16, y);
      doc.text(`${formatNumber(ing.total_used)} ${ing.base_unit}`, 120, y);
      doc.text(formatRupiah(ing.estimated_cost), 194, y, { align: 'right' });
      y += 4.5;
    });
  }

  // Tanda Tangan & Pengesahan di Bawah
  const signY = 258;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('Disetujui oleh Manajemen:', 14, signY);
  doc.text('Petugas Pelapor:', 140, signY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('( Owner Mango Nyeni )', 14, signY + 18);
  doc.text('( Kepala Kasir / Supervisor )', 140, signY + 18);

  const fileName = `Laporan-Keuangan-MangoNyeni-${data.startDate}-sd-${data.endDate}.pdf`;
  doc.save(fileName);
}
