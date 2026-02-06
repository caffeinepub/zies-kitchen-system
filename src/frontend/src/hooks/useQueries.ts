import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Transaksi, TransaksiSelesai, LaporanHarian, LaporanBulanan, RingkasanDashboard, UserProfile } from '../backend';

interface TambahTransaksiParams {
  tanggalTransaksiItem: bigint;
  items: Transaksi[];
  jumlahPembayaran: bigint;
  kembalian: bigint;
}

interface TambahPengeluaranParams {
  kategori: string;
  deskripsi: string;
  jumlah: bigint;
  tanggal: bigint;
  catatan: string | null;
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useTambahTransaksi() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tanggalTransaksiItem, items, jumlahPembayaran, kembalian }: TambahTransaksiParams) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.tambahTransaksi(tanggalTransaksiItem, items, jumlahPembayaran, kembalian);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaksi'] });
      queryClient.invalidateQueries({ queryKey: ['laporan'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useTambahPengeluaran() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ kategori, deskripsi, jumlah, tanggal, catatan }: TambahPengeluaranParams) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.tambahPengeluaran(kategori, deskripsi, jumlah, tanggal, catatan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['laporan'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useGetTransaksiHarian(timestamp: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<LaporanHarian>({
    queryKey: ['laporan', 'harian', timestamp.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getTransaksiHarian(timestamp);
    },
    enabled: !!actor && !isFetching,
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  });
}

export function useGetLaporanBulanan(timestamp: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<LaporanBulanan>({
    queryKey: ['laporan', 'bulanan', timestamp.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getLaporanBulanan(timestamp);
    },
    enabled: !!actor && !isFetching,
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  });
}

export function useGetTotalTransaksi() {
  const { actor, isFetching } = useActor();

  return useQuery<TransaksiSelesai[]>({
    queryKey: ['transaksi', 'all'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTotalTransaksi();
    },
    enabled: !!actor && !isFetching,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useGetRiwayatTransaksi(hari: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<TransaksiSelesai[]>({
    queryKey: ['transaksi', 'riwayat', hari.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRiwayatTransaksi(hari);
    },
    enabled: !!actor && !isFetching,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useGetRingkasanDashboard() {
  const { actor, isFetching } = useActor();

  return useQuery<RingkasanDashboard>({
    queryKey: ['dashboard', 'ringkasan'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getRingkasanDashboard();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time data
    staleTime: 15000, // 15 seconds
    retry: 3,
  });
}
