import { useState } from 'react';
import { Plus, Trash2, ShoppingBag, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useTambahTransaksi } from '../hooks/useQueries';
import type { Transaksi } from '../backend';

interface CartItem {
  id: string;
  namaProduk: string;
  harga: number;
  jumlah: number;
  subtotal: number;
}

export default function KasirPage() {
  const [namaProduk, setNamaProduk] = useState('');
  const [harga, setHarga] = useState('');
  const [jumlah, setJumlah] = useState('1');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [jumlahPembayaran, setJumlahPembayaran] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });

  const tambahTransaksiMutation = useTambahTransaksi();

  const handleAddToCart = () => {
    if (!namaProduk.trim()) {
      toast.error('Nama produk harus diisi');
      return;
    }
    if (!harga || parseFloat(harga) <= 0) {
      toast.error('Harga harus lebih dari 0');
      return;
    }
    if (!jumlah || parseInt(jumlah) <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    const hargaNum = parseFloat(harga);
    const jumlahNum = parseInt(jumlah);
    const subtotal = hargaNum * jumlahNum;

    const newItem: CartItem = {
      id: Date.now().toString(),
      namaProduk: namaProduk.trim(),
      harga: hargaNum,
      jumlah: jumlahNum,
      subtotal,
    };

    setCart([...cart, newItem]);
    setNamaProduk('');
    setHarga('');
    setJumlah('1');
    toast.success('Produk ditambahkan ke keranjang');
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
    toast.info('Produk dihapus dari keranjang');
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateKembalian = () => {
    const total = calculateTotal();
    const pembayaran = parseFloat(jumlahPembayaran) || 0;
    return pembayaran - total;
  };

  const isPembayaranValid = () => {
    const total = calculateTotal();
    const pembayaran = parseFloat(jumlahPembayaran) || 0;
    return pembayaran >= total;
  };

  const isTransactionDateValid = () => {
    if (!transactionDate) return false;
    const selectedDate = new Date(transactionDate);
    const now = new Date();
    return selectedDate <= now;
  };

  const handleSelesaikanTransaksi = async () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong, tambahkan produk terlebih dahulu');
      return;
    }

    if (!jumlahPembayaran || parseFloat(jumlahPembayaran) <= 0) {
      toast.error('Jumlah pembayaran harus diisi');
      return;
    }

    if (!isPembayaranValid()) {
      toast.error('Jumlah pembayaran tidak mencukupi');
      return;
    }

    if (!isTransactionDateValid()) {
      toast.error('Transaction date cannot be in the future');
      return;
    }

    const items: Transaksi[] = cart.map((item) => ({
      namaProduk: item.namaProduk,
      harga: BigInt(Math.round(item.harga)),
      jumlah: BigInt(item.jumlah),
      subtotal: BigInt(Math.round(item.subtotal)),
    }));

    const pembayaran = BigInt(Math.round(parseFloat(jumlahPembayaran)));
    const kembalian = BigInt(Math.round(calculateKembalian()));

    // Convert transaction date to nanoseconds timestamp
    const selectedDate = new Date(transactionDate);
    const tanggalTransaksiItem = BigInt(selectedDate.getTime()) * BigInt(1_000_000);

    try {
      await tambahTransaksiMutation.mutateAsync({ 
        tanggalTransaksiItem,
        items, 
        jumlahPembayaran: pembayaran, 
        kembalian 
      });
      toast.success('Transaksi berhasil disimpan!');
      setCart([]);
      setJumlahPembayaran('');
      // Reset to current date/time
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTransactionDate(`${year}-${month}-${day}T${hours}:${minutes}`);
    } catch (error) {
      toast.error('Gagal menyimpan transaksi: ' + (error as Error).message);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get max datetime (now)
  const getMaxDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Kasir</h2>
          <p className="text-muted-foreground">Tambahkan produk dan selesaikan transaksi</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form Input Produk */}
          <Card>
            <CardHeader>
              <CardTitle>Tambah Produk</CardTitle>
              <CardDescription>Masukkan detail produk yang akan dijual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="namaProduk">Nama Produk</Label>
                <Input
                  id="namaProduk"
                  placeholder="Contoh: Kopi Susu"
                  value={namaProduk}
                  onChange={(e) => setNamaProduk(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('harga')?.focus();
                    }
                  }}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="harga">Harga Satuan (Rp)</Label>
                  <Input
                    id="harga"
                    type="number"
                    placeholder="15000"
                    value={harga}
                    onChange={(e) => setHarga(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('jumlah')?.focus();
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jumlah">Jumlah</Label>
                  <Input
                    id="jumlah"
                    type="number"
                    placeholder="1"
                    value={jumlah}
                    onChange={(e) => setJumlah(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddToCart();
                      }
                    }}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddToCart} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Tambah ke Keranjang
              </Button>
            </CardFooter>
          </Card>

          {/* Keranjang Belanja */}
          <Card>
            <CardHeader>
              <CardTitle>Keranjang Belanja</CardTitle>
              <CardDescription>
                {cart.length === 0 ? 'Belum ada produk' : `${cart.length} produk`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Keranjang masih kosong
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="max-h-[300px] overflow-y-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produk</TableHead>
                          <TableHead className="text-right">Harga</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.namaProduk}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.harga)}
                            </TableCell>
                            <TableCell className="text-center">{item.jumlah}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(item.subtotal)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveFromCart(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-primary/10 p-4">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>

                  {/* Transaction Date/Time Section */}
                  <div className="space-y-2 rounded-lg border p-4">
                    <Label htmlFor="transactionDate" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Transaction Date & Time
                    </Label>
                    <Input
                      id="transactionDate"
                      type="datetime-local"
                      value={transactionDate}
                      max={getMaxDateTime()}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      className="w-full"
                    />
                    {!isTransactionDateValid() && transactionDate && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Transaction date cannot be in the future
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Payment Section */}
                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="space-y-2">
                      <Label htmlFor="jumlahPembayaran">Jumlah Pembayaran (Rp)</Label>
                      <Input
                        id="jumlahPembayaran"
                        type="number"
                        placeholder="Masukkan jumlah pembayaran"
                        value={jumlahPembayaran}
                        onChange={(e) => setJumlahPembayaran(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSelesaikanTransaksi();
                          }
                        }}
                      />
                    </div>

                    {jumlahPembayaran && parseFloat(jumlahPembayaran) > 0 && (
                      <>
                        {!isPembayaranValid() && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Jumlah pembayaran tidak mencukupi. Kurang {formatCurrency(Math.abs(calculateKembalian()))}
                            </AlertDescription>
                          </Alert>
                        )}

                        {isPembayaranValid() && (
                          <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                            <span className="font-medium">Kembalian:</span>
                            <span className="text-xl font-bold text-secondary-foreground">
                              {formatCurrency(calculateKembalian())}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSelesaikanTransaksi}
                disabled={
                  cart.length === 0 || 
                  tambahTransaksiMutation.isPending || 
                  !isPembayaranValid() || 
                  !jumlahPembayaran ||
                  !isTransactionDateValid()
                }
                className="w-full gap-2"
                size="lg"
              >
                {tambahTransaksiMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    Selesaikan Transaksi
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
