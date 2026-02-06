import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Header from './components/Header';
import Footer from './components/Footer';
import InstallPrompt from './components/InstallPrompt';
import ProfileSetup from './components/ProfileSetup';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import KasirPage from './pages/KasirPage';
import LaporanPage from './pages/LaporanPage';
import PengeluaranPage from './pages/PengeluaranPage';
import { useInternetIdentity } from './hooks/useInternetIdentity';

const queryClient = new QueryClient();

function AuthenticatedLayout() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <InstallPrompt />
      <Toaster />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: AuthenticatedLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

const kasirRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/kasir',
  component: KasirPage,
});

const pengeluaranRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pengeluaran',
  component: PengeluaranPage,
});

const laporanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/laporan',
  component: LaporanPage,
});

const routeTree = rootRoute.addChildren([dashboardRoute, kasirRoute, pengeluaranRoute, laporanRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <StrictMode>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <ProfileSetup />
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
