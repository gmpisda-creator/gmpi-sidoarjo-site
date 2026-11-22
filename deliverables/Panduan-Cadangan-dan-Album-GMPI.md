# Panduan pengurus: cadangan data dan album kegiatan GMPI

## Status
Panduan ini bukan bukti bahwa backup sudah dibuat. Belum ada pencadangan database, pengunduhan dokumen anggota, penjadwalan otomatis, ataupun uji pemulihan yang dijalankan dari chat.

## A. Yang harus dicadangkan
1. **Kode:** repositori GitHub resmi dan salinan lokal; termasuk migration SQL.
2. **Database:** skema, data, role/grant dan konfigurasi kebijakan. CSV per tabel hanya salinan tambahan, bukan pengganti backup database yang bisa dipulihkan.
3. **Storage:** file asli di setiap bucket, baik publik maupun privat. Backup database biasanya hanya menyertakan metadata Storage, bukan file objeknya.
4. **Pengaturan layanan:** daftar domain/DNS, URL login, daftar nama secret Edge Function, metode deployment dan daftar pengelola. Simpan nilai secret secara terpisah di password manager, bukan GitHub/dokumen biasa/chat.
5. **Auth:** pastikan metode backup/restore yang digunakan mencakup data autentikasi yang diperlukan. Dump skema public saja bukan backup akun login. Ikuti dokumentasi resmi Supabase sesuai metode backup yang tersedia.

## B. Jadwal dan penanggung jawab
- Tunjuk satu Pemilik sebagai petugas backup dan satu pengganti yang berwenang.
- Setiap minggu serta sebelum perubahan database besar: database dan Storage.
- Simpan 4 backup mingguan dan 3 bulanan sebagai jadwal awal; sesuaikan dengan kebijakan retensi data pribadi organisasi. Penghapusan data pribadi juga perlu diperhitungkan dalam retensi cadangan.
- Catat waktu, cakupan, lokasi, ukuran, petugas, hasil checksum, serta hasil uji pemulihan terakhir.
- Gunakan prinsip 3-2-1 bila memungkinkan: salinan utama + dua cadangan, dua jenis penyimpanan, satu di lokasi berbeda.

## C. Pelaksanaan aman
1. Buka proyek Supabase yang benar: `iapwzhlcwprzojeruymm`. Periksa menu backup dan opsi unduh yang tersedia pada paket saat ini. Jangan menganggap paket Free menyediakan backup unduhan/PITR; jangan mengaktifkan paket berbayar tanpa persetujuan.
2. Jika perlu backup manual melalui Supabase CLI, jalankan dari komputer pengelola yang aman dengan prosedur resmi Supabase. Jangan kirim password database/service-role key di chat. Pastikan dump memuat cakupan yang dibutuhkan, bukan hanya public.
3. Salin file Storage secara terpisah dengan akses Pemilik yang sah. Pertahankan nama bucket dan path. Jangan mengubah bucket privat menjadi publik demi mengunduhnya.
4. Buat manifest jumlah file, ukuran dan SHA-256 untuk mendeteksi file yang kurang/rusak. Catat kegagalan unduh; backup tidak boleh dinyatakan lengkap bila ada kegagalan.
5. Enkripsi arsip yang berisi NIK/KTP/foto/surat privat sebelum disimpan ke media cadangan. Simpan kata sandi arsip secara terpisah. Jika memakai Drive, batasi akses ke petugas yang berwenang, bukan “siapa saja yang memiliki link”.
6. Jangan menyimpan dump, file identitas, atau kredensial di folder website/GitHub. Jangan mengirim cadangan melalui WhatsApp umum.

## D. Uji pemulihan
- Lakukan di lingkungan uji terisolasi, **jangan di database produksi**.
- Gunakan dokumentasi restore resmi untuk versi layanan yang digunakan; jangan mengimpor skema internal layanan secara sembarangan.
- Jangan aktifkan pengiriman email/notifikasi nyata dari lingkungan uji.
- Periksa jumlah baris, relasi, RLS, akun login yang memang termasuk backup, fungsi, bucket, jumlah file dan checksum.
- Pastikan dokumen privat tetap tidak bisa dibaca pengunjung umum.
- Uji satu alur kegiatan dan kartu dengan data uji. Catat hasil. Backup baru disebut teruji setelah pemulihan ini sukses.
- Hapus lingkungan uji yang memuat data sensitif sesuai kebijakan setelah pengujian selesai.

## E. Album multifoto Lensa Kegiatan
Aktivasi database: jalankan `supabase/migrations/202610310039_activity_albums.sql` di SQL Editor proyek GMPI. SQL ini menambah kolom album, tidak mengubah tabel anggota atau surat. UI satu foto tetap bekerja sebelum migrasi; bagian album belum aktif.

Setelah aktif:
1. Admin → Lensa Kegiatan → Tambah/Ubah.
2. Pilih satu sampul dan maksimal **9 foto tambahan** (total 10), JPG/PNG/WebP maksimal 5 MB per file.
3. Foto baru ditambahkan setelah foto lama. Centang “Kosongkan foto tambahan lama” untuk mengganti seluruh album tambahan; sampul tetap terpisah.
4. Pilih Draf/Tayang/Disembunyikan lalu Simpan. Buka pratinjau tersimpan untuk melihat seluruh foto dan video.
5. Video tetap opsional, satu MP4 maksimal 25 MB. Foto lama NTT tidak otomatis dimigrasikan ke admin.

**Privasi:** bucket activity-media publik. Draf menyembunyikan teks kegiatan, bukan URL file. Mengosongkan album hanya melepas referensi; tidak menghapus file dari Storage. Jangan memasukkan foto sensitif. Jika penyimpanan gagal, muat ulang daftar sebelum mengirim ulang agar tidak membuat duplikat.

## F. Checklist pencatatan backup
- [ ] Tanggal/waktu dan petugas tercatat
- [ ] Database dan skema yang dicakup jelas
- [ ] File Storage dan manifest lengkap
- [ ] Arsip terenkripsi dan akses terbatas
- [ ] Secret disimpan terpisah
- [ ] Tidak ada salinan di folder publik/GitHub
- [ ] Uji pemulihan di lingkungan terisolasi berhasil
