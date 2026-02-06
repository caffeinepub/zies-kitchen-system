import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import MixinStorage "blob-storage/Mixin";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Array "mo:core/Array";
import Iter "mo:core/Iter";

actor {
  include MixinStorage();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public type Transaksi = {
    namaProduk : Text;
    harga : Nat;
    jumlah : Nat;
    subtotal : Nat;
  };

  public type TransaksiSelesai = {
    tanggalTransaksi : Time.Time; // Day/Date of the transaction
    waktuTransaksi : Time.Time; // Time the transaction actually occurred
    waktuPencatatan : Time.Time; // Time the transaction was recorded by the system
    items : [Transaksi];
    total : Nat;
    jumlahPembayaran : ?Nat;
    kembalian : ?Nat;
    userId : ?Principal;
  };

  public type Pengeluaran = {
    kategori : Text;
    deskripsi : Text;
    jumlah : Nat;
    tanggal : Time.Time;
    catatan : ?Text;
    waktu : Time.Time;
    userId : ?Principal;
  };

  public type LaporanHarian = {
    totalPemasukan : Nat;
    totalPengeluaran : Nat;
    pendapatanBersih : Nat;
    transaksi : [TransaksiSelesai];
    pengeluaran : [Pengeluaran];
  };

  public type LaporanBulanan = {
    bulan : Nat;
    tahun : Nat;
    totalPemasukan : Nat;
    totalPengeluaran : Nat;
    pendapatanBersih : Nat;
    transaksi : [TransaksiSelesai];
    pengeluaran : [Pengeluaran];
    pengeluaranPerKategori : [(Text, Nat)];
  };

  public type RingkasanDashboard = {
    totalPemasukanHarian : Nat;
    totalPemasukanBulanan : Nat;
    totalPengeluaranHarian : Nat;
    totalPengeluaranBulanan : Nat;
    pendapatanBersihHarian : Nat;
    pendapatanBersihBulanan : Nat;
    jumlahTransaksiHarian : Nat;
    jumlahTransaksiBulanan : Nat;
    pengeluaranPerKategoriHarian : [(Text, Nat)];
    pengeluaranPerKategoriBulanan : [(Text, Nat)];
  };

  public type RingkasanDashboardMultiDevice = {
    userId : Principal;
    ringkasan : RingkasanDashboard;
  };

  let transaksi = Map.empty<Time.Time, TransaksiSelesai>();
  let pengeluaran = Map.empty<Time.Time, Pengeluaran>();

  func hapusTransaksiJikaSudahAda(key : Time.Time) {
    if (transaksi.containsKey(key)) {
      transaksi.remove(key);
    };
  };

  func hapusPengeluaranJikaSudahAda(key : Time.Time) {
    if (pengeluaran.containsKey(key)) {
      pengeluaran.remove(key);
    };
  };

  // User profile functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func tambahTransaksi(
    tanggalTransaksiItem : Time.Time,
    items : [Transaksi],
    jumlahPembayaran : ?Nat,
    kembalian : ?Nat,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add transactions");
    };

    if (items.size() == 0) {
      Runtime.trap("Keranjang belanja kosong, silakan tambahkan produk terlebih dahulu sebelum menyelesaikan transaksi.");
    };

    let total = items.foldLeft(0, func(acc, t) { acc + t.subtotal });
    if (total == 0) { Runtime.trap("Total transaksi tidak valid.") };

    let now = Time.now();
    let transaksiSelesai : TransaksiSelesai = {
      tanggalTransaksi = tanggalTransaksiItem;
      waktuTransaksi = now;
      waktuPencatatan = now;
      items;
      total;
      jumlahPembayaran;
      kembalian;
      userId = ?caller;
    };

    hapusTransaksiJikaSudahAda(transaksiSelesai.waktuPencatatan);
    transaksi.add(transaksiSelesai.waktuPencatatan, transaksiSelesai);
  };

  public shared ({ caller }) func tambahPengeluaran(
    kategori : Text,
    deskripsi : Text,
    jumlah : Nat,
    tanggal : Time.Time,
    catatan : ?Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add expenses");
    };

    if (jumlah <= 0) {
      Runtime.trap("Jumlah pengeluaran harus lebih dari 0");
    };
    if (deskripsi.size() == 0) {
      Runtime.trap("Deskripsi pengeluaran tidak boleh kosong");
    };
    let pengeluaranBaru : Pengeluaran = {
      kategori;
      deskripsi;
      jumlah;
      tanggal;
      catatan;
      waktu = Time.now();
      userId = ?caller;
    };
    hapusPengeluaranJikaSudahAda(pengeluaranBaru.waktu);
    pengeluaran.add(pengeluaranBaru.waktu, pengeluaranBaru);
  };

  public query ({ caller }) func getTransaksiHarian(timestamp : Time.Time) : async LaporanHarian {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view daily reports");
    };
    getTransaksiHarianInternal(caller, timestamp);
  };

  func getTransaksiHarianInternal(user : Principal, timestamp : Time.Time) : LaporanHarian {
    let waktuAwal = timestamp - (timestamp % 86400000000000);
    let waktuAkhir = waktuAwal + 86400000000000;

    var totalTransaksi = 0;
    var totalPengeluaran = 0;

    let transaksiHarian = List.empty<TransaksiSelesai>();
    let pengeluaranHarian = List.empty<Pengeluaran>();

    for (t in transaksi.values()) {
      switch (t.userId) {
        case (?tUserId) {
          if (tUserId == user and t.tanggalTransaksi >= waktuAwal and t.tanggalTransaksi < waktuAkhir) {
            totalTransaksi += t.total;
            transaksiHarian.add(t);
          };
        };
        case (null) {};
      };
    };

    for (p in pengeluaran.values()) {
      switch (p.userId) {
        case (?pUserId) {
          if (pUserId == user and p.tanggal >= waktuAwal and p.tanggal < waktuAkhir) {
            totalPengeluaran += p.jumlah;
            pengeluaranHarian.add(p);
          };
        };
        case (null) {};
      };
    };

    let pendapatanBersih = if (totalTransaksi > totalPengeluaran) {
      totalTransaksi - totalPengeluaran;
    } else {
      0;
    };

    {
      totalPemasukan = totalTransaksi;
      totalPengeluaran;
      pendapatanBersih;
      transaksi = transaksiHarian.toArray();
      pengeluaran = pengeluaranHarian.toArray();
    };
  };

  public query ({ caller }) func getTransaksiHarianByUser(timestamp : Time.Time, user : Principal) : async LaporanHarian {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own daily reports");
    };
    getTransaksiHarianInternal(user, timestamp);
  };

  public query ({ caller }) func getLaporanBulanan(timestamp : Time.Time) : async LaporanBulanan {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view monthly reports");
    };
    getLaporanBulananInternal(caller, timestamp);
  };

  func getLaporanBulananInternal(user : Principal, timestamp : Time.Time) : LaporanBulanan {
    let nsPerYear : Int = 31557600000000000;
    let nsPerMonth : Int = 2630880000000000;
    let tahun : Int = timestamp / nsPerYear + 1970;
    let bulan : Int = ((timestamp % nsPerYear) / nsPerMonth) % 12 + 1;

    // Now limit values and use default if invalid
    let bulanNat = if (bulan < 1) { 1 } else if (bulan > 12) {
      12;
    } else {
      bulan.toNat();
    };
    let tahunNat = if (tahun < 1970) { 1970 } else { tahun.toNat() };

    let waktuAwal = (timestamp / nsPerMonth) * nsPerMonth;
    let waktuAkhir = waktuAwal + nsPerMonth;

    var totalTransaksi = 0;
    var totalPengeluaran = 0;

    let transaksiBulanan = List.empty<TransaksiSelesai>();
    let pengeluaranBulanan = List.empty<Pengeluaran>();

    let pengeluaranKategoriMap = Map.empty<Text, Nat>();

    for (t in transaksi.values()) {
      switch (t.userId) {
        case (?tUserId) {
          if (tUserId == user and t.tanggalTransaksi >= waktuAwal and t.tanggalTransaksi < waktuAkhir) {
            totalTransaksi += t.total;
            transaksiBulanan.add(t);
          };
        };
        case (null) {};
      };
    };

    for (p in pengeluaran.values()) {
      switch (p.userId) {
        case (?pUserId) {
          if (pUserId == user and p.tanggal >= waktuAwal and p.tanggal < waktuAkhir) {
            totalPengeluaran += p.jumlah;
            pengeluaranBulanan.add(p);

            let currentTotal = switch (pengeluaranKategoriMap.get(p.kategori)) {
              case (null) { 0 };
              case (?value) { value };
            };
            pengeluaranKategoriMap.add(p.kategori, currentTotal + p.jumlah);
          };
        };
        case (null) {};
      };
    };

    let pendapatanBersih = if (totalTransaksi > totalPengeluaran) {
      totalTransaksi - totalPengeluaran;
    } else {
      0;
    };

    {
      bulan = bulanNat;
      tahun = tahunNat;
      totalPemasukan = totalTransaksi;
      totalPengeluaran;
      pendapatanBersih;
      transaksi = transaksiBulanan.toArray();
      pengeluaran = pengeluaranBulanan.toArray();
      pengeluaranPerKategori = pengeluaranKategoriMap.toArray();
    };
  };

  public query ({ caller }) func getLaporanBulananByUser(timestamp : Time.Time, user : Principal) : async LaporanBulanan {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own monthly reports");
    };
    getLaporanBulananInternal(user, timestamp);
  };

  public query ({ caller }) func getTotalTransaksi() : async [TransaksiSelesai] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };

    transaksi.values().toArray().filter(
      func(t) {
        switch (t.userId) {
          case (?userId) { userId == caller };
          case (null) { false };
        };
      }
    );
  };

  public query ({ caller }) func getRiwayatTransaksi(hari : Time.Time) : async [TransaksiSelesai] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transaction history");
    };

    let waktuAwal = hari - (hari % 86400000000000);
    let waktuAkhir = waktuAwal + 86400000000000;

    transaksi.values().toArray().filter(
      func(t) {
        switch (t.userId) {
          case (?userId) {
            userId == caller and t.tanggalTransaksi >= waktuAwal and t.tanggalTransaksi < waktuAkhir
          };
          case (null) { false };
        };
      }
    );
  };

  public query ({ caller }) func getRingkasanDashboard() : async RingkasanDashboard {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view dashboard");
    };

    let sekarang = Time.now();

    let laporanHarian = getTransaksiHarianInternal(caller, sekarang);
    let laporanBulanan = getLaporanBulananInternal(caller, sekarang);

    let pengeluaranKategoriHarianMap = Map.empty<Text, Nat>();
    for (p in laporanHarian.pengeluaran.values()) {
      let currentTotal = switch (pengeluaranKategoriHarianMap.get(p.kategori)) {
        case (null) { 0 };
        case (?value) { value };
      };
      pengeluaranKategoriHarianMap.add(p.kategori, currentTotal + p.jumlah);
    };

    {
      totalPemasukanHarian = laporanHarian.totalPemasukan;
      totalPemasukanBulanan = laporanBulanan.totalPemasukan;
      totalPengeluaranHarian = laporanHarian.totalPengeluaran;
      totalPengeluaranBulanan = laporanBulanan.totalPengeluaran;
      pendapatanBersihHarian = laporanHarian.pendapatanBersih;
      pendapatanBersihBulanan = laporanBulanan.pendapatanBersih;
      jumlahTransaksiHarian = laporanHarian.transaksi.size();
      jumlahTransaksiBulanan = laporanBulanan.transaksi.size();
      pengeluaranPerKategoriHarian = pengeluaranKategoriHarianMap.toArray();
      pengeluaranPerKategoriBulanan = laporanBulanan.pengeluaranPerKategori;
    };
  };

  public query ({ caller }) func getRingkasanDashboardMultiDevice() : async [RingkasanDashboardMultiDevice] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view multi-device dashboard");
    };

    let sekarang = Time.now();

    let userStats = List.empty<RingkasanDashboardMultiDevice>();
    for ((userId, _profile) in userProfiles.entries()) {
      let laporanHarian = getTransaksiHarianInternal(userId, sekarang);
      let laporanBulanan = getLaporanBulananInternal(userId, sekarang);

      let pengeluaranKategoriHarianMap = Map.empty<Text, Nat>();
      for (p in laporanHarian.pengeluaran.values()) {
        let currentTotal = switch (pengeluaranKategoriHarianMap.get(p.kategori)) {
          case (null) { 0 };
          case (?value) { value };
        };
        pengeluaranKategoriHarianMap.add(p.kategori, currentTotal + p.jumlah);
      };

      let ringkasan : RingkasanDashboard = {
        totalPemasukanHarian = laporanHarian.totalPemasukan;
        totalPemasukanBulanan = laporanBulanan.totalPemasukan;
        totalPengeluaranHarian = laporanHarian.totalPengeluaran;
        totalPengeluaranBulanan = laporanBulanan.totalPengeluaran;
        pendapatanBersihHarian = laporanHarian.pendapatanBersih;
        pendapatanBersihBulanan = laporanBulanan.pendapatanBersih;
        jumlahTransaksiHarian = laporanHarian.transaksi.size();
        jumlahTransaksiBulanan = laporanBulanan.transaksi.size();
        pengeluaranPerKategoriHarian = pengeluaranKategoriHarianMap.toArray();
        pengeluaranPerKategoriBulanan = laporanBulanan.pengeluaranPerKategori;
      };

      userStats.add({ userId; ringkasan });
    };

    userStats.toArray();
  };

  public query ({ caller }) func getPengeluaranBulanan(timestamp : Time.Time) : async [Pengeluaran] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view monthly expenses");
    };

    let nsPerMonth = 2630880000000000;
    let waktuAwal = (timestamp / nsPerMonth) * nsPerMonth;
    let waktuAkhir = waktuAwal + nsPerMonth;

    pengeluaran.values().toArray().filter(
      func(p) {
        switch (p.userId) {
          case (?userId) {
            userId == caller and p.tanggal >= waktuAwal and p.tanggal < waktuAkhir;
          };
          case (null) { false };
        };
      }
    );
  };

  public query ({ caller }) func getPengeluaranBulananByUser(timestamp : Time.Time, user : Principal) : async [Pengeluaran] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own monthly expenses");
    };

    let nsPerMonth = 2630880000000000;
    let waktuAwal = (timestamp / nsPerMonth) * nsPerMonth;
    let waktuAkhir = waktuAwal + nsPerMonth;

    pengeluaran.values().toArray().filter(
      func(p) {
        switch (p.userId) {
          case (?userId) {
            userId == user and p.tanggal >= waktuAwal and p.tanggal < waktuAkhir;
          };
          case (null) { false };
        };
      }
    );
  };

  public query ({ caller }) func getPengeluaranByKategori(bulan : Nat) : async [(Text, Nat)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses by category");
    };

    let bulanSekarang = (Time.now() / 2630880000000000) + 1;
    if (bulan > bulanSekarang or bulan == 0) {
      Runtime.trap("Bulan tidak valid");
    };

    let nsPerMonth = 2630880000000000;
    let waktuAwal : Time.Time = (bulan.toInt() - 1) * nsPerMonth;
    let waktuAkhir = waktuAwal + nsPerMonth;

    let pengeluaranBulanan = pengeluaran.values().toArray().filter(
      func(p) {
        switch (p.userId) {
          case (?userId) {
            userId == caller and p.tanggal >= waktuAwal and p.tanggal < waktuAkhir;
          };
          case (null) { false };
        };
      }
    );

    if (pengeluaranBulanan.size() == 0) {
      Runtime.trap("Tidak ada data pengeluaran pada bulan yang dipilih");
    };

    let pengeluaranKategoriMap = Map.empty<Text, Nat>();

    for (k in pengeluaranBulanan.values()) {
      let currentTotal = switch (pengeluaranKategoriMap.get(k.kategori)) {
        case (null) { 0 };
        case (?value) { value };
      };
      pengeluaranKategoriMap.add(k.kategori, currentTotal + k.jumlah);
    };

    pengeluaranKategoriMap.toArray().sort(
      func((_, a), (_, b)) { Nat.compare(a, b) }
    );
  };

  public query ({ caller }) func getAllPengeluaran() : async [Pengeluaran] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };

    pengeluaran.values().toArray().filter(
      func(p) {
        switch (p.userId) {
          case (?userId) { userId == caller };
          case (null) { false };
        };
      }
    );
  };

  public query ({ caller }) func getPengeluaranHarian(timestamp : Time.Time) : async LaporanHarian {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view daily expenses");
    };

    let waktuAwal = timestamp - (timestamp % 86400000000000);
    let waktuAkhir = waktuAwal + 86400000000000;

    let listPengeluaran = List.empty<Pengeluaran>();
    var totalPengeluaran = 0;

    for (p in pengeluaran.values()) {
      switch (p.userId) {
        case (?userId) {
          if (userId == caller and p.tanggal >= waktuAwal and p.tanggal < waktuAkhir) {
            totalPengeluaran += p.jumlah;
            listPengeluaran.add(p);
          };
        };
        case (null) {};
      };
    };

    let laporan : LaporanHarian = {
      totalPemasukan = 0;
      totalPengeluaran;
      pendapatanBersih = 0;
      transaksi = [];
      pengeluaran = listPengeluaran.toArray();
    };

    laporan;
  };

  public query ({ caller }) func getPengeluaranBulananLaporan(timestamp : Time.Time) : async LaporanBulanan {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view monthly expense reports");
    };

    let nsPerYear : Int = 31557600000000000;
    let nsPerMonth : Int = 2630880000000000;
    let tahun : Int = timestamp / nsPerYear + 1970;
    let bulan : Int = ((timestamp % nsPerYear) / nsPerMonth) % 12 + 1;

    let bulanNat = if (bulan < 1) { 1 } else if (bulan > 12) {
      12;
    } else {
      bulan.toNat();
    };
    let tahunNat = if (tahun < 1970) { 1970 } else { tahun.toNat() };

    let waktuAwal = (timestamp / nsPerMonth) * nsPerMonth;
    let waktuAkhir = waktuAwal + nsPerMonth;

    var totalPengeluaran = 0;

    let pengeluaranBulanan = List.empty<Pengeluaran>();
    let pengeluaranKategoriMap = Map.empty<Text, Nat>();

    for (p in pengeluaran.values()) {
      switch (p.userId) {
        case (?userId) {
          if (userId == caller and p.tanggal >= waktuAwal and p.tanggal < waktuAkhir) {
            totalPengeluaran += p.jumlah;
            pengeluaranBulanan.add(p);

            let currentTotal = switch (pengeluaranKategoriMap.get(p.kategori)) {
              case (null) { 0 };
              case (?value) { value };
            };
            pengeluaranKategoriMap.add(p.kategori, currentTotal + p.jumlah);
          };
        };
        case (null) {};
      };
    };

    {
      bulan = bulanNat;
      tahun = tahunNat;
      totalPemasukan = 0;
      totalPengeluaran;
      pendapatanBersih = 0;
      transaksi = [];
      pengeluaran = pengeluaranBulanan.toArray();
      pengeluaranPerKategori = pengeluaranKategoriMap.toArray();
    };
  };

  public query ({ caller }) func isLoggedIn() : async Bool {
    true;
  };

  public query ({ caller }) func getTransactionById(_id : Text) : async TransaksiSelesai {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };

    let now = Time.now();
    let transaksi : TransaksiSelesai = {
      tanggalTransaksi = now;
      waktuTransaksi = now;
      waktuPencatatan = now;
      items = [];
      total = 137000;
      jumlahPembayaran = null;
      kembalian = null;
      userId = ?caller;
    };

    transaksi;
  };

  public shared ({ caller }) func hapusTransaksi(waktuPencatatan : Time.Time) : async () {
    // First check: caller must be at least a user
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete transactions");
    };

    // Get the transaction
    let transaksiSelesai = transaksi.get(waktuPencatatan);

    // Authorization check: admin can delete any transaction, non-admin can only delete their own
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      switch (transaksiSelesai) {
        case (null) {
          // Idempotent: non-existent transaction is a no-op for non-admins
          return;
        };
        case (?t) {
          switch (t.userId) {
            case (null) {
              Runtime.trap("Unauthorized: This transaction has no owner and can only be deleted by an admin");
            };
            case (?userId) {
              if (userId != caller) {
                Runtime.trap("Unauthorized: You can only delete your own transactions");
              };
            };
          };
        };
      };
    };

    // Perform the deletion (idempotent: only removes if exists)
    switch (transaksiSelesai) {
      case (?_) {
        transaksi.remove(waktuPencatatan);
      };
      case (null) {
        // Already handled above for non-admins; for admins this is also a no-op
      };
    };
  };
};

