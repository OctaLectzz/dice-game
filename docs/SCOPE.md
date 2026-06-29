# Scope Aplikasi Dice Quasar

## Tujuan

Membuat aplikasi permainan Dice untuk hiburan pribadi dengan tampilan mobile portrait dan mekanisme roll dadu otomatis yang dibuat mendekati referensi video.

## Alur Aplikasi

START → Splash Screen → Menu Utama → Halaman Permainan → Roll Dadu → Animasi → Generate Angka 1-6 → Tampilkan Hasil → Simpan Riwayat → Cek Selesai → Halaman Hasil → Main Lagi/Kembali Menu → END

## Modul

### 1. Splash Screen
- Menampilkan logo aplikasi.
- Auto redirect ke Menu Utama.

### 2. Menu Utama
- Mulai Bermain.
- Cara Bermain.
- Pengaturan.
- Keluar.

### 3. Cara Bermain
- Menjelaskan tahapan permainan secara sederhana.

### 4. Pengaturan
- Nama pemain.
- Jumlah dadu.
- Jumlah ronde.
- Suara.
- Getar.
- Riwayat.
- Skor/chip.
- Kecepatan animasi.

### 5. Halaman Permainan
- Menampilkan dadu.
- Menampilkan tombol roll.
- Menampilkan animasi cup.
- Menampilkan hasil dadu.
- Menyimpan riwayat hasil.
- Menampilkan skor/chip opsional.

### 6. Halaman Hasil
- Menampilkan total ronde.
- Menampilkan total skor.
- Menampilkan chip akhir.
- Menampilkan ringkasan riwayat.
- Tombol Main Lagi dan Kembali ke Menu.

## Batasan

- Tidak memakai backend.
- Tidak memakai login.
- Tidak memakai uang asli, top up, withdrawal, atau fitur transaksi.
- Data riwayat hanya tersimpan selama sesi permainan dan pengaturan tersimpan di localStorage.
