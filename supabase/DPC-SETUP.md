# Direktori DPC kecamatan

1. Jalankan seluruh `migrations/202610310043_dpc_directory.sql` sekali di SQL Editor proyek website. Tidak berisi data anggota contoh. Jika sudah pernah berhasil, jangan ulangi CREATE TABLE.
2. Setelah frontend terpasang, login sebagai Pemilik atau Editor Situs → tab **DPC Kecamatan**.
3. Tambah anggota/pengurus: pilih salah satu 18 kecamatan, nama, jabatan (teks bebas: Ketua DPC, Sekretaris, Bendahara, Anggota, dll.), dan urutan tampil.
4. Simpan sebagai draf untuk peninjauan. Centang **Terbitkan** hanya jika identitas/jabatan boleh ditampilkan publik dan susunan sudah disahkan pengurus. Data tak terbit ditolak RLS untuk publik.
5. Buka beranda `/#dpc`, perluas bagian DPC dan filter kecamatan. Pengunjung hanya membaca nama, jabatan, dan kecamatan, bukan data kontak/NIK/KTP.
6. Ubah atau hapus baris dari admin. Menghapus direktori tidak menghapus KTA/pendaftaran.

Model awal adalah direktori anggota per kecamatan, bukan sistem pengesahan DPC: tidak menyatakan semua 18 DPC terbentuk. Tidak mengimpor KTA, mengubah jabatan KTA/DPD, memberi akun pengurus DPC, ataupun menambahkan foto secara otomatis. Nama/jabatan diisi manual oleh pengurus berwenang. Tidak ada batas jumlah anggota per DPC; data dibaca per halaman 100 baris.

Validasi: `node scripts/dpc/test.mjs`, `node --check dpc.js`, `node --check admin.js`, `git diff --check`. Pengujian ini statis, bukan pengujian RLS live atau browser end-to-end. SQL perlu aktivasi dan pengujian draf/terbit/admin oleh operator. Sebelum aktivasi halaman menampilkan pemberitahuan belum dapat dimuat, bukan data buatan.
