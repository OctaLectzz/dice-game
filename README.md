# Dice Fun - Quasar Dice Game

Aplikasi permainan Dice untuk hiburan pribadi, dibuat menggunakan Quasar + Vue 3 dan disiapkan agar bisa dibuild menjadi APK Android melalui Capacitor.

## Fitur

- Splash Screen
- Menu Utama
- Halaman Permainan
- Animasi lempar dadu/cup
- Generate angka acak 1-6 otomatis
- Dukungan 1 sampai 3 dadu
- Riwayat hasil roll
- Skor dan chip hiburan lokal
- Pengaturan nama pemain, jumlah dadu, ronde, suara, getar, dan kecepatan animasi
- Halaman Hasil Akhir
- Layout mobile portrait mengikuti referensi video: top slot cards, red dice cup, roll button, result/history panel

## Struktur Folder

```txt
src/
  components/
    DiceCup.vue
    DiceFace.vue
    GameHeaderSlots.vue
  css/
    app.css
  layouts/
    MainLayout.vue
  pages/
    SplashPage.vue
    MenuPage.vue
    GamePage.vue
    HowToPlayPage.vue
    SettingsPage.vue
    ResultPage.vue
  router/
    index.js
    routes.js
  stores/
    gameStore.js
```

## Cara Menjalankan Web Preview

```bash
npm install
npm run dev
```

## Cara Menyiapkan Build APK Android

Install Quasar CLI jika belum ada:

```bash
npm install -g @quasar/cli
```

Tambahkan mode Capacitor:

```bash
quasar mode add capacitor
```

Jalankan mode Android untuk development:

```bash
npm run dev:android
```

Build Android:

```bash
npm run build:android
```

Setelah build, buka folder Android melalui Android Studio untuk membuat APK debug/release sesuai kebutuhan signing.

## Catatan Produksi

1. Source code ini belum menyertakan file APK karena APK harus dibuild pada komputer yang memiliki Android Studio, Android SDK, dan konfigurasi signing.
2. Chip dalam aplikasi ini hanya skor hiburan lokal, bukan sistem taruhan atau transaksi uang.
3. Bila ingin benar-benar sama dengan video referensi, aset visual seperti gambar cup/dadu asli bisa diganti dari CSS menjadi asset PNG/SVG custom.
4. Untuk kebutuhan client, tahap berikutnya adalah testing di device Android fisik, resize tampilan pada beberapa ukuran layar, lalu build APK final.
