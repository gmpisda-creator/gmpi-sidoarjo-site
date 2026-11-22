# Mengaktifkan Lensa Kegiatan

Kode UI saja belum cukup. Jalankan `supabase/migrations/202610310038_lensa_kegiatan.sql` sekali di SQL Editor proyek Supabase yang sama dengan situs. Tidak mengubah tabel anggota, KTP, berita, atau surat. Koneksi Arena pada pengerjaan ini mengembalikan daftar proyek kosong, sehingga migrasi belum dijalankan dari chat.

## Penggunaan
1. Login Admin sebagai Pemilik atau Editor Situs, buka **Lensa Kegiatan**.
2. Tambah kegiatan, isi judul, kategori, keterangan faktual; tanggal boleh kosong.
3. Pilih satu foto sampul JPG/PNG/WebP maksimal 5 MB dan opsional satu video MP4 maksimal 25 MB.
4. Pilih Draf/Tayang/Disembunyikan, simpan. Pratinjau tersedia untuk konten yang sudah disimpan.
5. Beranda mengambil maksimal 100 kegiatan tayang terbaru; admin memuat maksimal 200 entri terbaru.

## Batas dan privasi
- **Bucket activity-media publik.** Teks draf/disembunyikan hanya dibaca editor, tetapi file media yang URL-nya diketahui tetap dapat dibuka, bahkan sesudah kegiatan disembunyikan. Jangan unggah KTP, dokumen internal, atau foto tanpa izin publikasi.
- Mengganti/menghapus video dari entri tidak menghapus file lama. Berkas yang gagal terhubung setelah gangguan penyimpanan juga dapat tertinggal. Pembersihan file dilakukan pengelola melalui Storage setelah memeriksa referensinya.
- Album multifoto tersedia setelah migrasi `202610310039_activity_albums.sql` (1 sampul + 9 foto tambahan). Belum ada pagination admin, penghapusan permanen melalui UI, audit perubahan khusus, atau unggah video lebih dari 25 MB.
- Dokumentasi lama (termasuk NTT) tetap statis dan tidak muncul di daftar edit. Jangan menambah NTT lagi kecuali memang kegiatan baru.
- Tidak ada HTML dari pengguna yang dieksekusi; teks ditampilkan dengan textContent dan path media divalidasi.

## Uji penerimaan setelah SQL
- Owner/editor dapat membuat dan mengubah draf; registrar/mitra media tanpa role editor tidak dapat mengubah kegiatan atau mengunggah ke bucket.
- Buat kegiatan uji dengan foto tidak sensitif. Draf tidak muncul di jendela samaran; status Tayang muncul di Lensa Kegiatan; Disembunyikan menghilangkannya.
- Filter kategori bekerja pada entri baru dan lama.
- Dialog menampilkan foto, teks, dan video; Escape/Tutup menutup dialog dan menghentikan video.
- Pastikan draf tidak dapat dibaca lewat REST sebagai anon; file bucket publik memang tetap dapat diakses.
- Periksa di HP serta saat koneksi terputus. Beranda harus mempertahankan dokumentasi lama.

## Pembaruan album
Lihat `deliverables/Panduan-Cadangan-dan-Album-GMPI.md` untuk aktivasi, batas media dan panduan backup. Migrasi album belum dijalankan dari chat. Foto tambahan lama tetap dipertahankan kecuali opsi kosongkan dipilih.
