import { TrendingUp, Receipt, Calendar, Wallet, TrendingDown, DollarSign, AlertCircle, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGetRingkasanDashboard, useGetCallerUserProfile } from '../hooks/useQueries';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function DashboardPage() {
  const { data: ringkasan, isLoading, isError, error } = useGetRingkasanDashboard();
  const { data: userProfile } = useGetCallerUserProfile();

  const formatCurrency = (amount: bigint | number) => {
    const numAmount = typeof amount === 'bigint' ? Number(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  const chartData = ringkasan
    ? [
        {
          name: 'Hari Ini',
          pemasukan: Number(ringkasan.totalPemasukanHarian),
          pengeluaran: Number(ringkasan.totalPengeluaranHarian),
          pendapatanBersih: Number(ringkasan.pendapatanBersihHarian),
        },
        {
          name: 'Bulan Ini',
          pemasukan: Number(ringkasan.totalPemasukanBulanan),
          pengeluaran: Number(ringkasan.totalPengeluaranBulanan),
          pendapatanBersih: Number(ringkasan.pendapatanBersihBulanan),
        },
      ]
    : [];

  if (isError) {
    return (
      <div className="container py-8">
        <div className="mx-auto max-w-6xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Gagal memuat data dashboard. {error instanceof Error ? error.message : 'Silakan coba lagi.'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Ringkasan</h2>
          <p className="text-muted-foreground">
            {userProfile?.name ? `Selamat datang, ${userProfile.name}!` : 'Ringkasan penjualan dan pengeluaran hari ini dan bulan ini'}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Total Pemasukan Hari Ini */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pemasukan Hari Ini</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(ringkasan?.totalPemasukanHarian || BigInt(0))}
                  </div>
                  <p className="text-xs text-muted-foreground">Total penjualan hari ini</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Pengeluaran Hari Ini */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pengeluaran Hari Ini</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-destructive">
                    {formatCurrency(ringkasan?.totalPengeluaranHarian || BigInt(0))}
                  </div>
                  <p className="text-xs text-muted-foreground">Total pengeluaran hari ini</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pendapatan Bersih Hari Ini */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendapatan Bersih Hari Ini</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                    {formatCurrency(ringkasan?.pendapatanBersihHarian || BigInt(0))}
                  </div>
                  <p className="text-xs text-muted-foreground">Pemasukan - Pengeluaran</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Pemasukan Bulan Ini */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pemasukan Bulan Ini</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(ringkasan?.totalPemasukanBulanan || BigInt(0))}
                  </div>
                  <p className="text-xs text-muted-foreground">Total penjualan bulan ini</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Pengeluaran Bulan Ini */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pengeluaran Bulan Ini</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-destructive">
                    {formatCurrency(ringkasan?.totalPengeluaranBulanan || BigInt(0))}
                  </div>
                  <p className="text-xs text-muted-foreground">Total pengeluaran bulan ini</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pendapatan Bersih Bulan Ini */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendapatan Bersih Bulan Ini</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                    {formatCurrency(ringkasan?.pendapatanBersihBulanan || BigInt(0))}
                  </div>
                  <p className="text-xs text-muted-foreground">Pemasukan - Pengeluaran</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transaction Count Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transaksi Hari Ini</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {Number(ringkasan?.jumlahTransaksiHarian || BigInt(0))}
                  </div>
                  <p className="text-xs text-muted-foreground">Jumlah transaksi hari ini</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transaksi Bulan Ini</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {Number(ringkasan?.jumlahTransaksiBulanan || BigInt(0))}
                  </div>
                  <p className="text-xs text-muted-foreground">Jumlah transaksi bulan ini</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Expense by Category - Daily */}
        {ringkasan?.pengeluaranPerKategoriHarian && ringkasan.pengeluaranPerKategoriHarian.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Pengeluaran Per Kategori (Hari Ini)
              </CardTitle>
              <CardDescription>Breakdown pengeluaran hari ini berdasarkan kategori</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ringkasan.pengeluaranPerKategoriHarian.map(([kategori, jumlah]) => (
                  <div key={kategori} className="flex items-center justify-between rounded-lg border p-3">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      {kategori}
                    </span>
                    <span className="font-bold text-destructive">
                      {formatCurrency(jumlah)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expense by Category - Monthly */}
        {ringkasan?.pengeluaranPerKategoriBulanan && ringkasan.pengeluaranPerKategoriBulanan.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Pengeluaran Per Kategori (Bulan Ini)
              </CardTitle>
              <CardDescription>Breakdown pengeluaran bulan ini berdasarkan kategori</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ringkasan.pengeluaranPerKategoriBulanan.map(([kategori, jumlah]) => (
                  <div key={kategori} className="flex items-center justify-between rounded-lg border p-3">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      {kategori}
                    </span>
                    <span className="font-bold text-destructive">
                      {formatCurrency(jumlah)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Section */}
        <Card>
          <CardHeader>
            <CardTitle>Grafik Keuangan</CardTitle>
            <CardDescription>Perbandingan pemasukan, pengeluaran, dan pendapatan bersih</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
                      return value;
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="pemasukan"
                    fill="hsl(var(--primary))"
                    radius={[8, 8, 0, 0]}
                    name="Pemasukan"
                  />
                  <Bar
                    dataKey="pengeluaran"
                    fill="hsl(var(--destructive))"
                    radius={[8, 8, 0, 0]}
                    name="Pengeluaran"
                  />
                  <Bar
                    dataKey="pendapatanBersih"
                    fill="hsl(142 76% 36%)"
                    radius={[8, 8, 0, 0]}
                    name="Pendapatan Bersih"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Cepat</CardTitle>
            <CardDescription>Statistik penjualan terkini</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Rata-rata per Transaksi (Hari Ini)</p>
                  <p className="text-xl font-bold">
                    {ringkasan && Number(ringkasan.jumlahTransaksiHarian) > 0
                      ? formatCurrency(
                          Number(ringkasan.totalPemasukanHarian) /
                            Number(ringkasan.jumlahTransaksiHarian)
                        )
                      : formatCurrency(0)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Rata-rata per Transaksi (Bulan Ini)</p>
                  <p className="text-xl font-bold">
                    {ringkasan && Number(ringkasan.jumlahTransaksiBulanan) > 0
                      ? formatCurrency(
                          Number(ringkasan.totalPemasukanBulanan) /
                            Number(ringkasan.jumlahTransaksiBulanan)
                        )
                      : formatCurrency(0)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
