## 📘 DOKUMENTASI PENGGUNAAN

### ⚙️ SetUp / Instalasi

1. Jalankan instalasi untuk **Node.js dependencies**:
   ```bash
   npm install
   
2. Jalankan instalasi untuk **Composer dan Laravel dependencies**:
   ```bash
   composer install
   cp .env.example .env
   php artisan key:generate
   
3. Setelah Composer berhasil terinstal, lakukan setup terkait file .env
    (atur konfigurasi database, app key, dll), kemudian jalankan perintah berikut :
    ```bash
   php artisan migrate

4. Website siap dipakai!
Sebelum itu, untuk mengaktifkan seluruh fitur, silakan buka beberapa website berikut
untuk melakukan setup API key masing-masing : 
 - [https://clerk.com/] — digunakan untuk login & autentikasi.
Silakan sign up jika belum memiliki akun, lalu login untuk mendapatkan API key.
 - [https://currencyfreaks.com/] — digunakan untuk konversi mata uang.
Sign up atau login untuk mendapatkan API key.

5. Setelah itu, kalian bisa masuk ke dalam file `.env` untuk memasukkan masing masing api key nya

6. Kalian bisa memasukkan api clerk didalam kode berikut ini
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=YOUR_API_KEY
   CLERK_SECRET_KEY=YOUR_API_KEY
    ```
   dan memasukkan api currencyfreaks nya di kode berkikut :
    ```bash
    CURRENCY_API_KEY=YOUR_API_KEY

SELAMAT MENGGUNAKAN... apabila ada pertanyaan terkait setup maupun fitur bisa hubungi instagram berikut [https://instagram.com/bintang.ydha_]
