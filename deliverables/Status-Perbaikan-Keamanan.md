# Perbaikan keamanan — tahap lanjutan

## Aktivasi
Jalankan seluruh isi `supabase/migrations/202610310041_public_intake_privacy.sql` di New query pada SQL Editor proyek yang sama. Jangan tempel hasil CSV. Transaksi berakhir dengan COMMIT. Database live belum diubah oleh agen; tunggu konfirmasi hasil SQL dari operator.

## Perubahan
- Dua RPC riwayat/rincian iuran memerlukan peran owner, registrar, atau bendahara. EXECUTE anon/PUBLIC dicabut. Ringkasan publik tetap tersedia. Tidak ada akses riwayat anggota mandiri sampai autentikasi yang memadai tersedia; hubungi Bendahara.
- Form pencarian publik disembunyikan, dengan petunjuk bantuan. Ini bukan kontrol keamanan; SQL tetap wajib diterapkan. Panel admin iuran yang ada tidak diubah.
- RSVP berdasarkan nama tidak boleh menimpa jawaban lama kecuali Pemilik. Koreksi/nama sama dilayani pengurus. Ini mitigasi sementara, bukan bukti identitas pengirim pertama.
- Trigger sebelum INSERT menyerialkan pemeriksaan batas pendaftaran dan konfirmasi iuran. Pembayaran publik harus menunggu; nama dan nomor kartu yang disertakan harus cocok. Batas 60 kiriman/10 menit global serta 5 kiriman/jam per string telepon yang telah dibersihkan ke digit untuk pembayaran. Variasi awalan telepon masih dapat berbeda; bukan proteksi bot lengkap.
- Path foto yang sudah terkait pendaftaran tidak boleh dipakai ulang pada pendaftaran baru; harus unggah baru. Tidak membuktikan kepemilikan unggahan yang belum dikaitkan.
- Tidak menghapus data historis, tidak mengubah peran pengurus.

## Validasi
Pemeriksaan statis allowlist dan intake lulus; sintaks JavaScript dan git diff --check lulus. SQL belum diuji pada PostgreSQL live/isolated. Pengujian browser dan alur admin setelah aktivasi masih diperlukan. Jangan mengetes dengan menghapus data atau mengirim SOS sungguhan.

## Pekerjaan yang belum selesai
- Autentikasi anggota/OTP atau token pemulihan untuk riwayat dan RSVP.
- Upload terikat sesi, batas upload server dan proteksi bot; trigger INSERT tidak membatasi upload Storage langsung.
- Persetujuan privasi eksplisit server-side (fungsi lama masih menyimpan true).
- Pengetatan SOS, pemeriksaan versi Edge Function surat yang terpasang, dan audit menyeluruh grant/view/server lainnya.
- Angka batas global dapat menghambat pengguna sah saat spam; perlu pemantauan dan pembatasan per sumber di gateway terpercaya.

Jangan menyebut seluruh audit selesai atau website sepenuhnya aman berdasarkan patch ini.
