# MR ALL IN Business V2 — Draft untuk diuji

## Isi paket
- `index.html` + `manifest.webmanifest` + `sw.js` + icons: aplikasi web/PWA.
- `android/`: proyek Android Studio WebView; bisa menghasilkan APK setelah build.
- `.github/workflows/build-android-apk.yml`: alur GitHub Actions untuk membangun debug APK saat dijalankan di repo GitHub.
- `supabase/migrations/001_mrall_business_snapshot_sync.sql`: tabel cloud snapshot dengan Auth/RLS.
- `STOK_AWAL_PER_14_OKTOBER_2026.csv`: stok aktif awal.
- `MR_ALL_BUSINESS_OPENING_BACKUP_V2.json`: data pembuka yang dipakai app.
- `ARSIP_ASLI_JANGAN_DIEDIT/`: backup dan HTML sumber asli, disalin apa adanya.
- `MR_ALL_IN_BUSINESS_BLUEPRINT.md` dan `MR_ALL_IN_PERSONAL_BLUEPRINT.md`: blueprint referensi.

## Angka cutover yang dimasukkan
- Cash fisik aktual: Rp5.330.000, terdiri dari Rp4.330.000 milik owner + Rp1.000.000 dana teman yang harus dikembalikan hari itu.
- Hutang teman Rp1.000.000 sudah dicatat jatuh tempo 14 Oktober 2026. Jika benar-benar dibayar melalui tombol `Bayar`, cash berkurang menjadi Rp4.330.000.
- Stok aktif: Rp12.065.000, terdiri dari daftar baru Rp8.370.000 (dua HDD yang sudah terjual tidak lagi di stok aktif) + stok lama terpilih Rp3.695.000.
- Penjualan gabungan HDD PC 1TB + HDD PC 500GB health 100% dicatat sekali: omzet Rp350.000, modal Rp265.000, profit Rp85.000. Hasil penjualan diasumsikan sudah termasuk saldo cash aktual yang dimasukkan, jadi tidak ditambahkan lagi otomatis.
- Bulk lama saat ini nol stok; riwayat BulkSales dipertahankan. Backup sumber asli tidak diubah.
- Utang lain Rp5.390.000 tidak ditambahkan otomatis karena masih perlu dipastikan apakah bisnis/pribadi dan apakah termasuk dana teman.
- Pengeluaran dan pemasukan lama ditandai `Perlu diklasifikasi` (scope `review`) sampai diputuskan apakah benar bisnis. Ini mencegah profit usaha bersih salah karena pengeluaran campuran.

## Coba langsung di PC
1. Ekstrak ZIP.
2. Buka `index.html` dengan Chrome/Edge untuk pemeriksaan awal.
3. Untuk pemasangan PWA dan service worker, host file di HTTPS seperti GitHub Pages; upload `index.html`, `manifest.webmanifest`, `sw.js`, `icon-192.png`, `icon-512.png` bersama-sama.
4. Local storage perangkat/browser terpisah. Jangan mengandalkan satu file lokal sebagai sinkronisasi antar-perangkat.

## APK Android
APK belum bisa saya kompilasi langsung di lingkungan kerja ini karena Android SDK dan Gradle tidak tersedia. Proyek Android Studio sudah disiapkan:
- Buka folder `android/` di Android Studio, pasang SDK platform 35 bila diminta, lalu pilih **Build > Build APK(s)**.
- Atau masukkan isi folder ini ke repo GitHub, buka **Actions**, jalankan workflow `Build MR ALL IN Business APK`, lalu unduh artifact `MR-ALL-IN-Business-debug-APK`.
- Hasil workflow adalah debug APK untuk uji coba, bukan APK rilis Play Store.

## Sinkron cloud Supabase
Ini sengaja manual di V2 agar satu perangkat tidak diam-diam menimpa perangkat lainnya.
1. Buat project Supabase.
2. Jalankan SQL migration di `supabase/migrations/001_mrall_business_snapshot_sync.sql` melalui SQL Editor.
3. Pastikan Email/Password Auth aktif.
4. Di menu **Cloud**, masukkan Project URL dan publishable/anon key, daftar/masuk akun, lalu gunakan Upload di perangkat sumber dan Download di perangkat tujuan.
5. Gunakan hanya publishable/anon key, jangan `service_role`/secret key. RLS membatasi snapshot ke user yang login.
6. Upload mengganti snapshot cloud; download mengganti data lokal setelah konfirmasi. Backup JSON dahulu sebelum keduanya.

## Fitur V2 yang tersedia di basis proyek
- Dashboard stok/cash/profit, stok Ready dan status, cari/filter, edit/hapus stok aktif.
- Edit stok meminta alasan; perubahan dan hapus direkam di audit events.
- Bulk dan riwayat penjualan Bulk; stok Bulk aktif lama dikosongkan untuk cutover.
- Kasir/POS dengan keranjang multi-item, qty, diskon, FIFO antarunit dengan tanggal terlama, channel Offline/COD atau Shopee pending.
- Nota pelanggan dan nota internal yang terpisah; nota internal menampilkan HPP/profit.
- Status Shopee pending/uang masuk/refund; garansi dan recovery; hutang/piutang bisnis; barang titipan; pemasukan jasa.
- Pengeluaran bisnis dengan klasifikasi; item historis lama perlu ditinjau sebelum dianggap biaya bisnis.
- Pengambilan/gaji pemilik dengan `transfer_id`, bukan biaya operasional.
- Tutup hari memakai cash fisik terverifikasi dan observasi awal 7 hari.
- Backup/restore JSON, export CSV, PWA installability, cloud snapshot manual.

## Batas yang harus diketahui
- Ini cutover draft untuk uji, belum menggantikan website produksi.
- Cloud sync tahap ini adalah snapshot manual, bukan live realtime dan belum menjadi database relasional penuh seperti fase akhir blueprint.
- QR/thermal printer dan PDF printing bergantung browser/device/printer; di APK ada bridge cetak yang perlu diuji pada perangkat nyata.
- Beberapa data sejarah di sumber lama punya transaksi dengan harga/modal yang perlu audit; jangan menganggap laporan historis sempurna hanya karena dapat ditampilkan.
- Saldo dan stok awal perlu dicocokkan sekali dengan uang/barang fisik sebelum dipakai sebagai buku utama.

## Integrasi stok MR ALL IN Business → MR ALL IN Store (uji awal)

- Pada menu **Cloud / Sinkron Online**, isi email admin Store `raflicit29@gmail.com` dan password akun tersebut. Tombol sinkron memakai client Supabase Store terpisah, sehingga konfigurasi cloud snapshot Business yang sudah ada tidak perlu diganti.
- Sinkron Store hanya menerima akun admin Store yang ditentukan; autentikasinya terpisah dari sesi cloud snapshot Business.
- Di bagian **Sinkron stok ke MR ALL IN Store**, pilih hanya produk Ready yang ingin ditampilkan lalu tekan **Sinkronkan ke Store**.
- Data yang dipublikasikan hanya nama produk, kategori, harga jual, stok, status, dan URL gambar HTTP(S) jika tersedia. Modal, harga beli, laba, pengeluaran, utang, dan data pribadi tidak dikirim.
- Produk yang sudah dipublikasikan akan ikut diperbarui saat sinkron berikutnya. Jika stok Ready-nya habis, produk tersebut akan diperbarui menjadi stok 0 / TERJUAL.
- Sinkronisasi ini masih **manual melalui tombol**, bukan realtime otomatis. Setelah perubahan stok di POS, jalankan sinkronisasi untuk memperbarui Store.
- Fitur memakai tabel `categories` dan `products` yang sudah dipakai Store; tidak membutuhkan migration tambahan. RLS dan izin akun admin harus mengizinkan operasi yang sama seperti halaman admin Store.
- Uji satu produk terlebih dahulu dan periksa hasilnya di Store sebelum memilih produk lain. APK Android yang sudah terpasang tidak berubah otomatis; build APK baru diperlukan untuk memasukkan kode ini ke paket Android. PWA di hosting akan mengambil kode terbaru setelah pembaruan cache/refresh.


## Integrasi WD Business → MR ALL IN Personal

Pada menu **Gaji / WD Pemilik**, masukkan Project URL dan publishable/anon key dari proyek Supabase Personal, lalu login dengan akun Personal dan pilih rekening penerima. Password tidak disimpan oleh modul. WD baru mengurangi cash Business dan mencoba membuat pemasukan Personal dengan `source_transfer_id` unik; status pending dapat dicoba ulang tanpa membuat transaksi ganda. Jangan gunakan service-role key. Pastikan migration `001_personal_mvp.sql` pada repository `personal` sudah dijalankan di Supabase Personal. Transaksi WD lama tidak dipindahkan otomatis.
