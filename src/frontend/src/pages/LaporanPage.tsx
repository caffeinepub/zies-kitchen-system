import { useState } from 'react';
import { Calendar as CalendarIcon, TrendingUp, Receipt, Printer, Download, TrendingDown, DollarSign, Tag } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetTransaksiHarian, useGetLaporanBulanan, useHapusTransaksi } from '../hooks/useQueries';
import { DeleteTransactionDialog } from '../components/transactions/DeleteTransactionDialog';
import type { TransaksiSelesai, Pengeluaran } from '../backend';

export default function LaporanPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));
  const [activeTab, setActiveTab] = useState<string>('harian');

  // Convert Date to nanoseconds timestamp for backend
  const dailyTimestamp = BigInt(selectedDate.getTime()) * BigInt(1_000_000);
  const monthlyTimestamp = BigInt(selectedMonth.getTime()) * BigInt(1_000_000);
  
  const { data: laporanHarian, isLoading: isLoadingHarian } = useGetTransaksiHarian(dailyTimestamp);
  const { data: laporanBulanan, isLoading: isLoadingBulanan } = useGetLaporanBulanan(monthlyTimestamp);
  const { mutateAsync: hapusTransaksi, isPending: isDeletingTransaction } = useHapusTransaksi();

  const formatCurrency = (amount: bigint | number) => {
    const numAmount = typeof amount === 'bigint' ? Number(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatDateTime = (nanoTimestamp: bigint) => {
    const milliseconds = Number(nanoTimestamp / BigInt(1_000_000));
    return format(new Date(milliseconds), 'dd MMM yyyy, HH:mm', { locale: id });
  };

  const formatDateOnly = (nanoTimestamp: bigint) => {
    const milliseconds = Number(nanoTimestamp / BigInt(1_000_000));
    return format(new Date(milliseconds), 'dd MMM yyyy', { locale: id });
  };

  const handleDeleteTransaction = async (waktuPencatatan: bigint) => {
    try {
      await hapusTransaksi(waktuPencatatan);
      toast.success('Transaction deleted successfully');
    } catch (error: any) {
      console.error('Delete transaction error:', error);
      toast.error(error.message || 'Failed to delete transaction');
    }
  };

  const handlePrintHarian = () => {
    window.print();
  };

  const handlePrintBulanan = () => {
    window.print();
  };

  const handleExportCSVHarian = () => {
    if (!laporanHarian) return;

    const csvRows: string[] = [];
    csvRows.push('Jenis,Tanggal,Waktu,Kategori,Deskripsi/Produk,Jumlah/Qty,Harga,Subtotal,Jumlah Pembayaran,Kembalian,Catatan');
    
    // Add transactions
    laporanHarian.transaksi.forEach((transaksi: TransaksiSelesai) => {
      const milliseconds = Number(transaksi.tanggalTransaksi / BigInt(1_000_000));
      const tanggal = format(new Date(milliseconds), 'dd/MM/yyyy', { locale: id });
      const waktu = format(new Date(milliseconds), 'HH:mm:ss', { locale: id });
      const pembayaran = transaksi.jumlahPembayaran ? Number(transaksi.jumlahPembayaran) : '';
      const kembalian = transaksi.kembalian ? Number(transaksi.kembalian) : '';
      
      transaksi.items.forEach((item, idx) => {
        const row = [
          'Transaksi',
          tanggal,
          waktu,
          '',
          `"${item.namaProduk}"`,
          Number(item.jumlah),
          Number(item.harga),
          Number(item.subtotal),
          idx === 0 ? pembayaran : '',
          idx === 0 ? kembalian : '',
          ''
        ].join(',');
        csvRows.push(row);
      });
    });

    // Add expenses
    laporanHarian.pengeluaran.forEach((pengeluaran: Pengeluaran) => {
      const milliseconds = Number(pengeluaran.waktu / BigInt(1_000_000));
      const tanggal = format(new Date(milliseconds), 'dd/MM/yyyy', { locale: id });
      const waktu = format(new Date(milliseconds), 'HH:mm:ss', { locale: id });
      
      const row = [
        'Pengeluaran',
        tanggal,
        waktu,
        `"${pengeluaran.kategori}"`,
        `"${pengeluaran.deskripsi}"`,
        '',
        '',
        Number(pengeluaran.jumlah),
        '',
        '',
        `"${pengeluaran.catatan || ''}"`
      ].join(',');
      csvRows.push(row);
    });
    
    csvRows.push('');
    csvRows.push(`Total Pemasukan,,,,,,${Number(laporanHarian.totalPemasukan)},,,`);
    csvRows.push(`Total Pengeluaran,,,,,,${Number(laporanHarian.totalPengeluaran)},,,`);
    csvRows.push(`Pendapatan Bersih,,,,,,${Number(laporanHarian.pendapatanBersih)},,,`);
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const fileName = `laporan-harian-${format(selectedDate, 'yyyy-MM-dd')}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSVBulanan = () => {
    if (!laporanBulanan) return;

    const csvRows: string[] = [];
    csvRows.push('Jenis,Tanggal,Waktu,Kategori,Deskripsi/Produk,Jumlah/Qty,Harga,Subtotal,Jumlah Pembayaran,Kembalian,Catatan');
    
    // Add transactions
    laporanBulanan.transaksi.forEach((transaksi: TransaksiSelesai) => {
      const milliseconds = Number(transaksi.tanggalTransaksi / BigInt(1_000_000));
      const tanggal = format(new Date(milliseconds), 'dd/MM/yyyy', { locale: id });
      const waktu = format(new Date(milliseconds), 'HH:mm:ss', { locale: id });
      const pembayaran = transaksi.jumlahPembayaran ? Number(transaksi.jumlahPembayaran) : '';
      const kembalian = transaksi.kembalian ? Number(transaksi.kembalian) : '';
      
      transaksi.items.forEach((item, idx) => {
        const row = [
          'Transaksi',
          tanggal,
          waktu,
          '',
          `"${item.namaProduk}"`,
          Number(item.jumlah),
          Number(item.harga),
          Number(item.subtotal),
          idx === 0 ? pembayaran : '',
          idx === 0 ? kembalian : '',
          ''
        ].join(',');
        csvRows.push(row);
      });
    });

    // Add expenses
    laporanBulanan.pengeluaran.forEach((pengeluaran: Pengeluaran) => {
      const milliseconds = Number(pengeluaran.tanggal / BigInt(1_000_000));
      const tanggal = format(new Date(milliseconds), 'dd/MM/yyyy', { locale: id });
      const waktuMillis = Number(pengeluaran.waktu / BigInt(1_000_000));
      const waktu = format(new Date(waktuMillis), 'HH:mm:ss', { locale: id });
      
      const row = [
        'Pengeluaran',
        tanggal,
        waktu,
        `"${pengeluaran.kategori}"`,
        `"${pengeluaran.deskripsi}"`,
        '',
        '',
        Number(pengeluaran.jumlah),
        '',
        '',
        `"${pengeluaran.catatan || ''}"`
      ].join(',');
      csvRows.push(row);
    });
    
    csvRows.push('');
    csvRows.push(`Total Pemasukan,,,,,,${Number(laporanBulanan.totalPemasukan)},,,`);
    csvRows.push(`Total Pengeluaran,,,,,,${Number(laporanBulanan.totalPengeluaran)},,,`);
    csvRows.push(`Pendapatan Bersih,,,,,,${Number(laporanBulanan.pendapatanBersih)},,,`);
    
    // Add category breakdown
    if (laporanBulanan.pengeluaranPerKategori && laporanBulanan.pengeluaranPerKategori.length > 0) {
      csvRows.push('');
      csvRows.push('Pengeluaran Per Kategori');
      csvRows.push('Kategori,Jumlah');
      laporanBulanan.pengeluaranPerKategori.forEach(([kategori, jumlah]) => {
        csvRows.push(`"${kategori}",${Number(jumlah)}`);
      });
    }
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const fileName = `laporan-bulanan-${format(selectedMonth, 'yyyy-MM')}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Laporan Penjualan dan Pengeluaran</h2>
          <p className="text-muted-foreground">Lihat ringkasan penjualan dan pengeluaran harian dan bulanan</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="harian">Laporan Harian</TabsTrigger>
            <TabsTrigger value="bulanan">Laporan Bulanan</TabsTrigger>
          </TabsList>

          {/* Daily Report Tab */}
          <TabsContent value="harian" className="space-y-6">
            {/* Date Picker */}
            <Card>
              <CardHeader>
                <CardTitle>Pilih Tanggal</CardTitle>
                <CardDescription>Pilih tanggal untuk melihat laporan harian</CardDescription>
              </CardHeader>
              <CardContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2 sm:w-[280px]">
                      <CalendarIcon className="h-4 w-4" />
                      {format(selectedDate, 'dd MMMM yyyy', { locale: id })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                      locale={id}
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {isLoadingHarian ? '...' : formatCurrency(laporanHarian?.totalPemasukan || BigInt(0))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(selectedDate, 'dd MMMM yyyy', { locale: id })}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {isLoadingHarian ? '...' : formatCurrency(laporanHarian?.totalPengeluaran || BigInt(0))}
                  </div>
                  <p className="text-xs text-muted-foreground">Pengeluaran hari ini</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendapatan Bersih</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                    {isLoadingHarian ? '...' : formatCurrency(laporanHarian?.pendapatanBersih || BigInt(0))}
                  </div>
                  <p className="text-xs text-muted-foreground">Pemasukan - Pengeluaran</p>
                </CardContent>
              </Card>
            </div>

            {/* Transaction List */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Daftar Transaksi</CardTitle>
                    <CardDescription>
                      Rincian semua transaksi pada {format(selectedDate, 'dd MMMM yyyy', { locale: id })}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 print:hidden">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrintHarian}
                      disabled={isLoadingHarian || !laporanHarian?.transaksi || laporanHarian.transaksi.length === 0}
                      className="gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      Print
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCSVHarian}
                      disabled={isLoadingHarian || !laporanHarian}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Ekspor CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingHarian ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Memuat data...</p>
                  </div>
                ) : !laporanHarian?.transaksi || laporanHarian.transaksi.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Receipt className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Tidak ada transaksi pada tanggal ini
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {laporanHarian.transaksi.map((transaksi: TransaksiSelesai, idx: number) => (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">Transaksi #{idx + 1}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(transaksi.tanggalTransaksi)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Total</p>
                              <p className="text-lg font-bold text-primary">
                                {formatCurrency(transaksi.total)}
                              </p>
                            </div>
                            <DeleteTransactionDialog
                              transaction={transaksi}
                              onConfirm={() => handleDeleteTransaction(transaksi.waktuPencatatan)}
                              isDeleting={isDeletingTransaction}
                            />
                          </div>
                        </div>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Produk</TableHead>
                                <TableHead className="text-right">Harga</TableHead>
                                <TableHead className="text-center">Qty</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {transaksi.items.map((item, itemIdx) => (
                                <TableRow key={itemIdx}>
                                  <TableCell className="font-medium">{item.namaProduk}</TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(item.harga)}
                                  </TableCell>
                                  <TableCell className="text-center">{Number(item.jumlah)}</TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(item.subtotal)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {(transaksi.jumlahPembayaran !== undefined || transaksi.kembalian !== undefined) && (
                          <div className="grid gap-2 rounded-md border bg-muted/50 p-3 sm:grid-cols-2">
                            {transaksi.jumlahPembayaran !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Jumlah Pembayaran:</span>
                                <span className="text-sm font-semibold">{formatCurrency(transaksi.jumlahPembayaran)}</span>
                              </div>
                            )}
                            {transaksi.kembalian !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Kembalian:</span>
                                <span className="text-sm font-semibold">{formatCurrency(transaksi.kembalian)}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {idx < laporanHarian.transaksi.length - 1 && <Separator className="my-4" />}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expenses List */}
            <Card>
              <CardHeader>
                <CardTitle>Daftar Pengeluaran</CardTitle>
                <CardDescription>
                  Rincian semua pengeluaran pada {format(selectedDate, 'dd MMMM yyyy', { locale: id })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingHarian ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Memuat data...</p>
                  </div>
                ) : !laporanHarian?.pengeluaran || laporanHarian.pengeluaran.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <TrendingDown className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Tidak ada pengeluaran pada tanggal ini
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead>Deskripsi</TableHead>
                          <TableHead className="text-right">Jumlah</TableHead>
                          <TableHead>Catatan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {laporanHarian.pengeluaran.map((pengeluaran: Pengeluaran, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDateOnly(pengeluaran.tanggal)}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                {pengeluaran.kategori}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium">{pengeluaran.deskripsi}</TableCell>
                            <TableCell className="text-right font-semibold text-destructive">
                              {formatCurrency(pengeluaran.jumlah)}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                              {pengeluaran.catatan || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monthly Report Tab */}
          <TabsContent value="bulanan" className="space-y-6">
            {/* Month Picker */}
            <Card>
              <CardHeader>
                <CardTitle>Pilih Bulan</CardTitle>
                <CardDescription>Pilih bulan untuk melihat laporan bulanan</CardDescription>
              </CardHeader>
              <CardContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2 sm:w-[280px]">
                      <CalendarIcon className="h-4 w-4" />
                      {format(selectedMonth, 'MMMM yyyy', { locale: id })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedMonth}
                      onSelect={(date) => date && setSelectedMonth(startOfMonth(date))}
                      initialFocus
                      locale={id}
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {isLoadingBulanan ? '...' : formatCurrency(laporanBulanan?.totalPemasukan || BigInt(0))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(selectedMonth, 'MMMM yyyy', { locale: id })}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {isLoadingBulanan ? '...' : formatCurrency(laporanBulanan?.totalPengeluaran || BigInt(0))}
                  </div>
                  <p className="text-xs text-muted-foreground">Pengeluaran bulan ini</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendapatan Bersih</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                    {isLoadingBulanan ? '...' : formatCurrency(laporanBulanan?.pendapatanBersih || BigInt(0))}
                  </div>
                  <p className="text-xs text-muted-foreground">Pemasukan - Pengeluaran</p>
                </CardContent>
              </Card>
            </div>

            {/* Expense by Category */}
            {laporanBulanan?.pengeluaranPerKategori && laporanBulanan.pengeluaranPerKategori.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Pengeluaran Per Kategori
                  </CardTitle>
                  <CardDescription>Breakdown pengeluaran berdasarkan kategori</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {laporanBulanan.pengeluaranPerKategori.map(([kategori, jumlah]) => (
                      <div key={kategori} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            {kategori}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-destructive">
                          {formatCurrency(jumlah)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transaction List */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Daftar Transaksi</CardTitle>
                    <CardDescription>
                      Rincian semua transaksi pada {format(selectedMonth, 'MMMM yyyy', { locale: id })}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 print:hidden">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrintBulanan}
                      disabled={isLoadingBulanan || !laporanBulanan?.transaksi || laporanBulanan.transaksi.length === 0}
                      className="gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      Print
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCSVBulanan}
                      disabled={isLoadingBulanan || !laporanBulanan}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Ekspor CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingBulanan ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Memuat data...</p>
                  </div>
                ) : !laporanBulanan?.transaksi || laporanBulanan.transaksi.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Receipt className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Tidak ada transaksi pada bulan ini
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {laporanBulanan.transaksi.map((transaksi: TransaksiSelesai, idx: number) => (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">Transaksi #{idx + 1}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(transaksi.tanggalTransaksi)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Total</p>
                              <p className="text-lg font-bold text-primary">
                                {formatCurrency(transaksi.total)}
                              </p>
                            </div>
                            <DeleteTransactionDialog
                              transaction={transaksi}
                              onConfirm={() => handleDeleteTransaction(transaksi.waktuPencatatan)}
                              isDeleting={isDeletingTransaction}
                            />
                          </div>
                        </div>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Produk</TableHead>
                                <TableHead className="text-right">Harga</TableHead>
                                <TableHead className="text-center">Qty</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {transaksi.items.map((item, itemIdx) => (
                                <TableRow key={itemIdx}>
                                  <TableCell className="font-medium">{item.namaProduk}</TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(item.harga)}
                                  </TableCell>
                                  <TableCell className="text-center">{Number(item.jumlah)}</TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(item.subtotal)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {(transaksi.jumlahPembayaran !== undefined || transaksi.kembalian !== undefined) && (
                          <div className="grid gap-2 rounded-md border bg-muted/50 p-3 sm:grid-cols-2">
                            {transaksi.jumlahPembayaran !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Jumlah Pembayaran:</span>
                                <span className="text-sm font-semibold">{formatCurrency(transaksi.jumlahPembayaran)}</span>
                              </div>
                            )}
                            {transaksi.kembalian !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Kembalian:</span>
                                <span className="text-sm font-semibold">{formatCurrency(transaksi.kembalian)}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {idx < laporanBulanan.transaksi.length - 1 && <Separator className="my-4" />}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expenses List */}
            <Card>
              <CardHeader>
                <CardTitle>Daftar Pengeluaran</CardTitle>
                <CardDescription>
                  Rincian semua pengeluaran pada {format(selectedMonth, 'MMMM yyyy', { locale: id })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingBulanan ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Memuat data...</p>
                  </div>
                ) : !laporanBulanan?.pengeluaran || laporanBulanan.pengeluaran.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <TrendingDown className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Tidak ada pengeluaran pada bulan ini
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead>Deskripsi</TableHead>
                          <TableHead className="text-right">Jumlah</TableHead>
                          <TableHead>Catatan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {laporanBulanan.pengeluaran.map((pengeluaran: Pengeluaran, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDateOnly(pengeluaran.tanggal)}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                {pengeluaran.kategori}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium">{pengeluaran.deskripsi}</TableCell>
                            <TableCell className="text-right font-semibold text-destructive">
                              {formatCurrency(pengeluaran.jumlah)}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                              {pengeluaran.catatan || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
