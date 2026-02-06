import { useState } from 'react';
import { Plus, Calendar, Wallet, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTambahPengeluaran, useGetLaporanBulanan } from '../hooks/useQueries';
import { toast } from 'sonner';

const KATEGORI_OPTIONS = [
  'Bahan Baku',
  'Operasional',
  'Gaji',
  'Utilitas',
  'Transportasi',
  'Peralatan',
  'Lainnya',
];

export default function PengeluaranPage() {
  const [kategori, setKategori] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [catatan, setCatatan] = useState('');

  const tambahPengeluaran = useTambahPengeluaran();
  
  // Get current month's expenses
  const currentTimestamp = BigInt(Date.now() * 1000000);
  const { data: laporanBulanan, isLoading, isError } = useGetLaporanBulanan(currentTimestamp);

  const formatCurrency = (amount: bigint | number) => {
    const numAmount = typeof amount === 'bigint' ? Number(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const formatDateTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!kategori) {
      toast.error('Kategori pengeluaran harus dipilih');
      return;
    }

    if (!deskripsi.trim()) {
      toast.error('Deskripsi pengeluaran tidak boleh kosong');
      return;
    }

    const jumlahNum = parseFloat(jumlah);
    if (isNaN(jumlahNum) || jumlahNum <= 0) {
      toast.error('Jumlah pengeluaran harus lebih dari 0');
      return;
    }

    try {
      const tanggalDate = new Date(tanggal);
      const tanggalTimestamp = BigInt(tanggalDate.getTime() * 1000000);

      await tambahPengeluaran.mutateAsync({
        kategori,
        deskripsi: deskripsi.trim(),
        jumlah: BigInt(Math.round(jumlahNum)),
        tanggal: tanggalTimestamp,
        catatan: catatan.trim() || null,
      });

      toast.success('Pengeluaran berhasil ditambahkan');
      setKategori('');
      setDeskripsi('');
      setJumlah('');
      setTanggal(new Date().toISOString().split('T')[0]);
      setCatatan('');
    } catch (error: any) {
      console.error('Error adding expense:', error);
      toast.error(error.message || 'Gagal menambahkan pengeluaran');
    }
  };

  const totalPengeluaran = laporanBulanan?.pengeluaran.reduce(
    (sum, p) => sum + Number(p.jumlah),
    0
  ) || 0;

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pengeluaran</h2>
          <p className="text-muted-foreground">Kelola dan catat pengeluaran harian</p>
        </div>

        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Gagal memuat data pengeluaran. Silakan coba lagi.
            </AlertDescription>
          </Alert>
        )}

        {/* Form Input Pengeluaran */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Tambah Pengeluaran Baru
            </CardTitle>
            <CardDescription>Catat pengeluaran untuk laporan keuangan</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kategori">Kategori Pengeluaran</Label>
                  <Select value={kategori} onValueChange={setKategori} disabled={tambahPengeluaran.isPending}>
                    <SelectTrigger id="kategori">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {KATEGORI_OPTIONS.map((kat) => (
                        <SelectItem key={kat} value={kat}>
                          {kat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tanggal">Tanggal</Label>
                  <Input
                    id="tanggal"
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    disabled={tambahPengeluaran.isPending}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="deskripsi">Deskripsi Pengeluaran</Label>
                  <Input
                    id="deskripsi"
                    placeholder="Contoh: Beli bahan baku"
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    disabled={tambahPengeluaran.isPending}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jumlah">Jumlah (Rp)</Label>
                  <Input
                    id="jumlah"
                    type="number"
                    placeholder="0"
                    value={jumlah}
                    onChange={(e) => setJumlah(e.target.value)}
                    disabled={tambahPengeluaran.isPending}
                    required
                    min="1"
                    step="1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="catatan">Catatan Tambahan (Opsional)</Label>
                <Textarea
                  id="catatan"
                  placeholder="Tambahkan catatan jika diperlukan..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  disabled={tambahPengeluaran.isPending}
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={tambahPengeluaran.isPending} className="gap-2">
                <Plus className="h-4 w-4" />
                {tambahPengeluaran.isPending ? 'Menyimpan...' : 'Tambah Pengeluaran'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Ringkasan Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
                <p className="text-3xl font-bold text-destructive">{formatCurrency(totalPengeluaran)}</p>
                <p className="text-xs text-muted-foreground">
                  {laporanBulanan?.pengeluaran.length || 0} pengeluaran tercatat
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daftar Pengeluaran */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengeluaran</CardTitle>
            <CardDescription>Riwayat pengeluaran yang telah dicatat</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : laporanBulanan?.pengeluaran && laporanBulanan.pengeluaran.length > 0 ? (
              <div className="overflow-x-auto">
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
                    {[...laporanBulanan.pengeluaran]
                      .sort((a, b) => Number(b.waktu - a.waktu))
                      .map((pengeluaran, index) => (
                        <TableRow key={index}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatDate(pengeluaran.tanggal)}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                              {pengeluaran.kategori}
                            </span>
                          </TableCell>
                          <TableCell>{pengeluaran.deskripsi}</TableCell>
                          <TableCell className="text-right font-medium text-destructive">
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
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Wallet className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-lg font-medium text-muted-foreground">Belum ada pengeluaran</p>
                <p className="text-sm text-muted-foreground">
                  Tambahkan pengeluaran pertama Anda menggunakan form di atas
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
