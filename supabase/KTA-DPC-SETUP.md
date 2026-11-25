# DPD/DPC pada KTA

Jalankan SQL `202610310044_card_organization.sql` sekali. Transaksi membatalkan semua perubahan jika format fungsi persetujuan live tidak sesuai. Tidak mengubah nomor, token QR, data kartu lama, RLS, atau tanda tangan Ketua DPD.

Admin → Kartu anggota → Ubah kartu yang sudah ada (atau buat baru):
- Pilih tingkat DPD/DPC.
- Untuk DPC, pilih kecamatan organisasi. Kecamatan domisili tetap terpisah.
- Pilih jabatan; tulisan jabatan mendapat akhiran DPD atau DPC + kecamatan saat pilihan berubah. Periksa pratinjau dan kolom jabatan tertulis, yang masih boleh disesuaikan manual (60 karakter).
- Simpan. Perubahan identitas/penempatan kartu aktif kembali menunggu persetujuan, termasuk perubahan penempatan tanpa perubahan teks jabatan.
- Setujui melalui alur yang berlaku dan unduh/cetak ulang agar cetakan sesuai.

Kartu lama tampil 'Belum ditetapkan', bukan otomatis DPD/DPC. Jangan membuat kartu baru untuk sekadar mengubah penempatan. Nomor/QR dipertahankan, tetapi status verifikasi menunggu sampai disetujui kembali.

Jika SQL belum terpasang, pilihan baru nonaktif, menu kartu lama tetap tersedia. Gagal membaca kolom baru tidak mengirim kolom baru saat menyimpan. Direktori DPC publik tetap dikelola terpisah; perubahan KTA tidak otomatis menerbitkan nama ke direktori. Tidak ada perubahan layout kartu atau jabatan penandatangan.

Tes: node scripts/cards/test-organization.mjs; node --check admin.js; node --check card-organization.js; git diff --check. Tes tersebut bukan pengujian browser/admin atau RLS live. Verifikasi manual: kartu lama tak diubah, simpan baru DPC, buka lagi, pindah kecamatan DPC, kartu aktif kembali menunggu, nomor/QR tetap, setujui/cetak ulang sesuai prosedur.
