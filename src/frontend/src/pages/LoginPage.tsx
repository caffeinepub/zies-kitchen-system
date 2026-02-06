import { useState } from 'react';
import { LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    try {
      await login();
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Gagal login. Silakan coba lagi.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Branding */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary">Zie's Kitchen</h1>
          <p className="mt-2 text-muted-foreground">Sistem Kasir & Manajemen Keuangan</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Selamat Datang</CardTitle>
            <CardDescription>
              Login menggunakan Internet Identity untuk mengakses aplikasi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full gap-2"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Menghubungkan...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Login dengan Internet Identity
                </>
              )}
            </Button>

            <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
              <p className="font-medium">Fitur Aplikasi:</p>
              <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
                <li>Pencatatan transaksi penjualan</li>
                <li>Manajemen pengeluaran</li>
                <li>Laporan harian dan bulanan</li>
                <li>Sinkronisasi multi-perangkat</li>
                <li>Akses offline (PWA)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Data Anda aman dan tersinkronisasi di semua perangkat</p>
          <p className="mt-1">Dapat diakses dari ponsel, tablet, dan komputer</p>
        </div>
      </div>
    </div>
  );
}
