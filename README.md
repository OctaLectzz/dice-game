# 🎲 Dice Fun - Aplikasi Game Dadu 3D Interaktif

Aplikasi game dadu interaktif dengan visual 3D modern dan efek animasi realistis. Game ini dibuat menggunakan framework **Quasar (Vue 3)**, pustaka grafis **Three.js** untuk rendering 3D, dan **Capacitor** untuk dikonversi menjadi aplikasi Android (.APK).

Aplikasi ini ditujukan untuk hiburan personal, bermain bersama teman/keluarga secara offline, dengan pencatatan skor dan chip virtual lokal.

---

## 🌟 Fitur Utama

- **Visual 3D Realistis**: Dadu berbentuk kubus 3D yang berputar acak secara dinamis di dalam wadah piringan.
- **Animasi Penutup Cup**: Wadah dadu (cup merah) akan menutup dadu saat dikocok, bergetar dinamis, dan terangkat miring untuk memunculkan hasil dadu.
- **Jumlah Dadu Fleksibel**: Dapat dimainkan menggunakan 1, 2, atau hingga 3 dadu sekaligus.
- **Sistem Ronde & Skor Virtual**: Dilengkapi dengan perhitungan ronde, skor, dan chip virtual untuk simulasi permainan seru.
- **Riwayat Lemparan**: Panel khusus yang menampilkan hasil lemparan dadu sebelumnya secara langsung.
- **Pengaturan Lengkap**: 
  - Ubah Nama Pemain.
  - Atur Jumlah Dadu (1-3) & Jumlah Ronde Maksimal.
  - Nyalakan/Matikan suara & getar (vibrate) saat dadu dikocok.
  - Tampilkan/Sembunyikan Riwayat & Papan Skor.

---

## 💻 Persiapan Awal (Untuk Orang Awam)

Sebelum menjalankan aplikasi di komputer Anda, pastikan Anda telah menyiapkan beberapa hal dasar berikut:

1. **Node.js**: Software utama untuk menjalankan server pengembangan aplikasi web.
   - [Download Node.js di sini](https://nodejs.org/) (Pilih versi **LTS** yang direkomendasikan).
   - Setelah install, pastikan instalasi sukses dengan membuka Command Prompt (CMD) lalu ketik: `node -v` dan `npm -v`.
2. **Android Studio** *(Hanya jika ingin membuat aplikasi Android/APK sendiri)*:
   - [Download Android Studio di sini](https://developer.android.com/studio).
   - Berguna untuk menyediakan Android SDK (Software Development Kit) dan Java JDK bawaan yang dibutuhkan untuk proses pembuatan file `.apk`.

---

## 🚀 Cara Menjalankan Aplikasi di Web (Komputer/Laptop)

Ikuti langkah mudah berikut untuk membuka game di browser Anda:

1. **Download / Clone Source Code**:
   - Jika Anda menggunakan Git, jalankan:
     ```bash
     git clone https://github.com/Solveraindonesia/dice-game.git
     ```
   - Atau Anda bisa klik tombol **Code** -> **Download ZIP** di halaman GitHub ini, lalu ekstrak folder ZIP tersebut di komputer Anda.

2. **Masuk ke Folder Project**:
   - Buka Command Prompt (CMD) atau Terminal, lalu masuk ke direktori folder yang telah diekstrak:
     ```bash
     cd quasar-dice-game
     ```

3. **Install Dependensi**:
   - Download semua pustaka pendukung aplikasi dengan mengetik:
     ```bash
     npm install
     ```

4. **Jalankan Uji Coba Lokal (Web Preview)**:
   - Mulai server lokal dengan mengetik:
     ```bash
     npm run dev
     ```
   - Setelah proses selesai, browser Anda akan otomatis terbuka menampilkan game di alamat: `http://localhost:9000/`. Jika tidak terbuka otomatis, salin alamat tersebut ke Google Chrome atau browser lainnya.

---

## 🤖 Cara Membuat Aplikasi Android (File APK)

Aplikasi ini sudah dikonfigurasi menggunakan **Capacitor** agar bisa langsung dijadikan file APK Android tanpa perlu menulis kode Java baru.

### Langkah-langkah Pembuatan APK:

1. **Tambahkan Mode Android**:
   - Jalankan perintah berikut untuk menginisialisasi sistem Capacitor Android:
     ```bash
     npx quasar mode add capacitor
     ```
     *(Masukkan App ID: `com.solveraindonesia.dicegame` dan App Name: `Dice Fun` saat diminta).*

2. **Hubungkan Sistem Android SDK & Java JDK**:
   - Pastikan path Android SDK dan JDK Android Studio sudah terhubung dengan benar di sistem Anda. Anda bisa mengetik perintah berikut di command prompt untuk mengaturnya secara sementara sebelum build:
     ```cmd
     set JAVA_HOME=C:\PROGRA~1\Android\ANDROI~1\jbr
     set ANDROID_HOME=%USERPROFILE%\AppData\Local\Android\Sdk
     set ANDROID_SDK_ROOT=%USERPROFILE%\AppData\Local\Android\Sdk
     ```

3. **Build Web Assets**:
   - Kompilasi kode web game Anda menjadi siap pakai:
     ```bash
     npx quasar build -m capacitor -T android
     ```

4. **Kompilasi Menjadi APK**:
   - Masuk ke folder android dan jalankan gradle untuk membungkus game menjadi aplikasi debug siap install:
     ```cmd
     cd src-capacitor/android
     .\gradlew.bat assembleDebug
     ```

5. **Lokasi File APK**:
   - Setelah proses selesai (BUILD SUCCESSFUL), file APK debug Anda akan berada di:
     `src-capacitor/android/app/build/outputs/apk/debug/app-debug.apk`
   - Salin file `app-debug.apk` tersebut ke handphone Android Anda menggunakan kabel data atau WhatsApp/Google Drive, lalu buka file tersebut di handphone untuk menginstalnya.

---

## 📂 Struktur Utama Folder Aplikasi

Berikut adalah panduan singkat letak kode penting jika Anda ingin memodifikasinya:

- **`src/components/`**: Berisi komponen game seperti wadah kocokan (`DiceCup.vue`) dan komponen dadu 3D (`Dice3D.vue`).
- **`src/pages/`**: Halaman-halaman utama aplikasi (Splash Screen, Menu Utama, Area Bermain Game, Pengaturan, Cara Bermain, dan Hasil Akhir).
- **`src/css/app.css`**: Pengaturan tema visual, warna primer hijau/merah, bayangan, layout responsif, dan efek transisi.
- **`src/stores/gameStore.js`**: Pusat pengaturan logika game (state), seperti pengocokan angka dadu acak, pengurangan chip virtual, riwayat ronde, dan status selesai.
- **`src-capacitor/`**: Folder khusus konfigurasi native Android (dihasilkan otomatis setelah Capacitor ditambahkan).

---

## 📝 Catatan Penting

1. **Chip Virtual**: Chip di dalam game ini murni hanya berupa poin digital lokal untuk keseruan bermain dan **tidak memiliki nilai uang asli** (tidak ada fitur transaksi/perjudian).
2. **Three.js Optimization**: Game dadu 3D menggunakan WebGL. Jika game terasa lambat di perangkat Anda, pastikan fitur hardware acceleration pada Google Chrome sudah aktif di menu pengaturan browser Anda.
