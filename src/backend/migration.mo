import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  type OldTransaksiSelesai = {
    waktu : Time.Time;
    items : [{ namaProduk : Text; harga : Nat; jumlah : Nat; subtotal : Nat }];
    total : Nat;
    jumlahPembayaran : ?Nat;
    kembalian : ?Nat;
    userId : ?Principal;
  };

  type OldActor = {
    transaksi : Map.Map<Time.Time, OldTransaksiSelesai>;
  };

  type NewTransaksiSelesai = {
    tanggalTransaksi : Time.Time;
    waktuTransaksi : Time.Time;
    waktuPencatatan : Time.Time;
    items : [{ namaProduk : Text; harga : Nat; jumlah : Nat; subtotal : Nat }];
    total : Nat;
    jumlahPembayaran : ?Nat;
    kembalian : ?Nat;
    userId : ?Principal;
  };

  type NewActor = {
    transaksi : Map.Map<Time.Time, NewTransaksiSelesai>;
  };

  public func run(old : OldActor) : NewActor {
    let newTransaksi = old.transaksi.map<Time.Time, OldTransaksiSelesai, NewTransaksiSelesai>(
      func(_waktu, oldTransaksi) {
        let now = Time.now();
        {
          tanggalTransaksi = now;
          waktuTransaksi = now;
          waktuPencatatan = oldTransaksi.waktu;
          items = oldTransaksi.items;
          total = oldTransaksi.total;
          jumlahPembayaran = oldTransaksi.jumlahPembayaran;
          kembalian = oldTransaksi.kembalian;
          userId = oldTransaksi.userId;
        };
      }
    );
    { transaksi = newTransaksi };
  };
};
