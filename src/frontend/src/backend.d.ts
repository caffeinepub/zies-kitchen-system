import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface RingkasanDashboardMultiDevice {
    userId: Principal;
    ringkasan: RingkasanDashboard;
}
export interface RingkasanDashboard {
    jumlahTransaksiBulanan: bigint;
    totalPengeluaranBulanan: bigint;
    jumlahTransaksiHarian: bigint;
    pendapatanBersihBulanan: bigint;
    totalPengeluaranHarian: bigint;
    pengeluaranPerKategoriHarian: Array<[string, bigint]>;
    pendapatanBersihHarian: bigint;
    pengeluaranPerKategoriBulanan: Array<[string, bigint]>;
    totalPemasukanHarian: bigint;
    totalPemasukanBulanan: bigint;
}
export interface Transaksi {
    jumlah: bigint;
    harga: bigint;
    namaProduk: string;
    subtotal: bigint;
}
export interface Pengeluaran {
    jumlah: bigint;
    tanggal: Time;
    userId?: Principal;
    deskripsi: string;
    kategori: string;
    waktu: Time;
    catatan?: string;
}
export interface LaporanHarian {
    pengeluaran: Array<Pengeluaran>;
    totalPengeluaran: bigint;
    transaksi: Array<TransaksiSelesai>;
    totalPemasukan: bigint;
    pendapatanBersih: bigint;
}
export interface LaporanBulanan {
    tahun: bigint;
    pengeluaran: Array<Pengeluaran>;
    totalPengeluaran: bigint;
    pengeluaranPerKategori: Array<[string, bigint]>;
    transaksi: Array<TransaksiSelesai>;
    totalPemasukan: bigint;
    bulan: bigint;
    pendapatanBersih: bigint;
}
export interface UserProfile {
    name: string;
}
export interface TransaksiSelesai {
    total: bigint;
    userId?: Principal;
    jumlahPembayaran?: bigint;
    waktuTransaksi: Time;
    waktuPencatatan: Time;
    tanggalTransaksi: Time;
    kembalian?: bigint;
    items: Array<Transaksi>;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllPengeluaran(): Promise<Array<Pengeluaran>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getLaporanBulanan(timestamp: Time): Promise<LaporanBulanan>;
    getLaporanBulananByUser(timestamp: Time, user: Principal): Promise<LaporanBulanan>;
    getPengeluaranBulanan(timestamp: Time): Promise<Array<Pengeluaran>>;
    getPengeluaranBulananByUser(timestamp: Time, user: Principal): Promise<Array<Pengeluaran>>;
    getPengeluaranBulananLaporan(timestamp: Time): Promise<LaporanBulanan>;
    getPengeluaranByKategori(bulan: bigint): Promise<Array<[string, bigint]>>;
    getPengeluaranHarian(timestamp: Time): Promise<LaporanHarian>;
    getRingkasanDashboard(): Promise<RingkasanDashboard>;
    getRingkasanDashboardMultiDevice(): Promise<Array<RingkasanDashboardMultiDevice>>;
    getRiwayatTransaksi(hari: Time): Promise<Array<TransaksiSelesai>>;
    getTotalTransaksi(): Promise<Array<TransaksiSelesai>>;
    getTransactionById(_id: string): Promise<TransaksiSelesai>;
    getTransaksiHarian(timestamp: Time): Promise<LaporanHarian>;
    getTransaksiHarianByUser(timestamp: Time, user: Principal): Promise<LaporanHarian>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hapusTransaksi(waktuPencatatan: Time): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isLoggedIn(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    tambahPengeluaran(kategori: string, deskripsi: string, jumlah: bigint, tanggal: Time, catatan: string | null): Promise<void>;
    tambahTransaksi(tanggalTransaksiItem: Time, items: Array<Transaksi>, jumlahPembayaran: bigint | null, kembalian: bigint | null): Promise<void>;
}
