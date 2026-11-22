/* No persistent storage and no automatic retries: submissions may be committed even when responses are lost. */
(function (root) {
  async function readPhoto(file, label) {
    if (!file) throw new Error(`Pilih ${label} terlebih dahulu.`);
    if (!['image/jpeg', 'image/png'].includes(file.type)) throw new Error(`${label} harus JPG atau PNG.`);
    if (!file.size || file.size > 5 * 1024 * 1024) throw new Error(`${label} harus berukuran lebih dari 0 dan maksimal 5 MB.`);
    let bytes;
    try { bytes = await file.arrayBuffer(); }
    catch (_) { throw new Error(`${label} tidak dapat dibaca. Pilih ulang file dari penyimpanan komputer/HP, bukan file yang sudah dipindahkan atau belum selesai diunduh.`); }
    if (bytes.byteLength !== file.size) throw new Error(`${label} belum terbaca lengkap. Pilih ulang file tersebut.`);
    return new Blob([bytes], { type: file.type });
  }
  async function request(url, options, stage, submission = false) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);
    try { return await fetch(url, { ...options, signal: controller.signal }); }
    catch (_) {
      const detail = submission
        ? 'Status pendaftaran belum dapat dipastikan. Jangan kirim ulang dahulu; minta pengurus memeriksa apakah data sudah masuk.'
        : 'Periksa koneksi internet lalu coba lagi. Jangan pindahkan file selama proses berlangsung.';
      throw new Error(`${stage}: koneksi terputus, diblokir, atau waktu tunggu habis. ${detail} Isian tetap ada di halaman ini.`);
    } finally { clearTimeout(timer); }
  }
  root.GMPIRegistrationRequest = { readPhoto, request };
})(typeof window === 'undefined' ? globalThis : window);
