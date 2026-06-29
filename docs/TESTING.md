# Checklist Testing Aplikasi Dice

## Functional Test

- Splash screen tampil dan berpindah ke menu.
- Tombol Mulai Bermain membuka halaman permainan.
- Tombol Cara Bermain membuka panduan.
- Tombol Pengaturan membuka form setting.
- Setting jumlah dadu mengubah jumlah dadu pada permainan.
- Setting jumlah ronde mengatur batas akhir permainan.
- Tombol Roll menjalankan animasi.
- Angka hasil dadu berada pada rentang 1 sampai 6.
- Riwayat hasil bertambah setelah roll.
- Skor bertambah sesuai total dadu.
- Game selesai setelah ronde mencapai batas.
- Tombol Main Lagi mereset permainan.
- Tombol Kembali ke Menu berjalan.

## UI Test

- Tampilan nyaman pada layar portrait Android.
- Tombol roll mudah dijangkau ibu jari.
- Slot card atas tampil konsisten.
- Cup merah berada di tengah area permainan.
- Riwayat tidak menutup tombol roll.
- Halaman tetap rapi pada ukuran layar kecil.

## Build Test

- `npm install` berhasil.
- `npm run dev` berhasil.
- `quasar mode add capacitor` berhasil.
- `npm run dev:android` membuka Android Studio atau emulator.
- APK debug bisa diinstall di perangkat fisik.
