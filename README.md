# Gemini Game Master RPG

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg) ![Language](https://img.shields.io/badge/language-TypeScript-blue.svg) ![Framework](https://img.shields.io/badge/framework-React-61DAFB.svg) ![Styling](https://img.shields.io/badge/styling-Tailwind_CSS-38B2AC.svg) ![AI Backend](https://img.shields.io/badge/AI-Gemini_|_Ollama-purple.svg)

Sebuah RPG fantasi berbasis teks yang imersif di mana **AI canggih** bertindak sebagai *Game Master* (GM), secara dinamis menciptakan dunia, narasi, dan tantangan sebagai respons terhadap tindakan pemain.



---

## 📖 Tentang Proyek

Proyek ini adalah sebuah eksperimen untuk mengeksplorasi kekuatan Model Bahasa Besar (LLM) dalam menciptakan pengalaman bermain game yang benar-benar dinamis dan tidak terbatas. Tidak seperti RPG tradisional dengan skrip yang telah ditentukan, dunia dalam game ini hidup dan bereaksi terhadap setiap perintah Anda. AI bertindak sebagai otak dari permainan, mengelola status pemain, inventaris, quest, musuh, dan yang paling penting, menenun narasi yang menarik di sekitar keputusan Anda.

Fitur unik dari proyek ini adalah **dukungan AI dual-mode**:
1.  **☁️ Gemini (Cloud):** Manfaatkan kekuatan model canggih Google Gemini untuk penceritaan yang sangat kreatif, bernuansa, dan cerdas secara kontekstual. Mode ini memerlukan koneksi internet dan kunci API.
2.  **💻 Ollama (Lokal):** Jalankan Game Master di mesin Anda sendiri menggunakan Ollama. Ini sempurna untuk pengembangan offline, pengujian, atau bagi mereka yang lebih menyukai privasi dan kontrol penuh atas model AI mereka.

## ✨ Fitur Utama

-   **Penceritaan Dinamis:** Tidak ada dua petualangan yang sama. AI menghasilkan deskripsi, peristiwa, dan dialog NPC secara real-time.
-   **Dukungan AI Ganda:** Pilih antara Gemini (cloud) atau Ollama (lokal) sebagai Game Master Anda.
-   **Manajemen Status Karakter:** Lacak HP, MP, EXP, level, statistik (ATK/DEF), dan emas.
-   **Sistem Inventaris & Peralatan:** Kumpulkan, kelola, dan lengkapi item mulai dari pedang hingga ramuan penyembuh.
-   **Sistem Quest Interaktif:** Terima atau tolak quest yang ditawarkan oleh AI, dengan status yang dilacak dari aktif hingga selesai.
-   **Eksplorasi Berbasis Peta:** Jelajahi dunia yang dihasilkan secara prosedural di peta visual, petak demi petak.
-   **Pertempuran Taktis:** Lawan musuh yang dikendalikan AI, dengan status yang diperbarui secara dinamis.
-   **UI Responsif:** Antarmuka yang bersih dan modern yang dibangun dengan React dan Tailwind CSS, dapat dimainkan di desktop atau seluler.

## 🛠️ Teknologi yang Digunakan

-   **Frontend:** [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
-   **AI Services:**
    -   [@google/genai](https://www.npmjs.com/package/@google/genai) untuk Gemini API
    -   HTTP Fetch untuk [Ollama](https://ollama.com/)
-   **Build Tool:** Vite

## 🚀 Instalasi & Menjalankan

Untuk menjalankan proyek ini secara lokal, ikuti langkah-langkah berikut.

### Prasyarat

1.  **Node.js:** Pastikan Anda telah menginstal Node.js (disarankan v18+).
2.  **Kunci API Gemini (Opsional):** Jika Anda ingin menggunakan mode Gemini, Anda memerlukan kunci API dari [Google AI Studio](https://aistudio.google.com/app/apikey).
3.  **Ollama (Opsional):** Jika Anda ingin menggunakan mode Ollama:
    -   Instal [Ollama](https://ollama.com/) di komputer Anda.
    -   Tarik model yang kompatibel. Proyek ini diatur untuk `llama3` secara default, tetapi Anda dapat mengubahnya.
        ```bash
        ollama pull llama3
        ```
    -   Pastikan server Ollama berjalan di latar belakang.

### Langkah-langkah Instalasi

1.  **Clone repositori ini:**
    ```bash
    git clone https://github.com/your-username/gemini-gamemaster-rpg.git
    cd gemini-gamemaster-rpg
    ```

2.  **Instal dependensi:**
    ```bash
    npm install
    ```

3.  **Siapkan variabel lingkungan:**
    Buat file `.env` di direktori root proyek dengan menyalin dari `.env.example` (jika ada) atau membuatnya dari awal. Tambahkan kunci API Gemini Anda.
    ```
    # .env
    VITE_API_KEY="Y0UR_G3M1N1_AP1_K3Y"
    ```
    *Catatan: Awalan `VITE_` diperlukan agar Vite dapat mengekspos variabel ke aplikasi frontend.*

4.  **Jalankan server pengembangan:**
    ```bash
    npm run dev
    ```
    Aplikasi sekarang akan berjalan di `http://localhost:5173` (atau port lain yang tersedia).

## 🎮 Cara Bermain

1.  **Pilih Layanan AI:** Saat pertama kali memulai, Anda akan diminta untuk memilih antara **Gemini (Cloud)** atau **Ollama (Lokal)**.
2.  **Buat Karakter Anda:** Beri nama pahlawan Anda untuk memulai petualangan.
3.  **Berinteraksi dengan Dunia:** Ketik perintah di kotak input untuk berinteraksi dengan dunia. Coba hal-hal seperti:
    -   `lihat sekeliling`
    -   `pergi ke utara`
    -   `periksa inventaris`
    -   `serang goblin`
    -   `bicara dengan penjaga toko`
4.  **Nikmati Petualangannya:** AI akan mendeskripsikan hasilnya dan memperbarui dunia di sekitar Anda. Biarkan imajinasi Anda menjadi panduan Anda!

## 📂 Struktur Proyek

```
/
├── public/              # Aset statis
├── src/
│   ├── components/      # Komponen UI React yang dapat digunakan kembali
│   ├── services/        # Logika bisnis (aiService, mapService)
│   ├── App.tsx          # Komponen aplikasi utama dan logika state
│   ├── constants.ts     # Konstanta awal game (status pemain, dunia, dll.)
│   ├── index.tsx        # Titik masuk aplikasi
│   └── types.ts         # Definisi tipe TypeScript untuk status game
├── .env                 # File variabel lingkungan (tidak dilacak oleh git)
├── index.html           # Template HTML utama
└── README.md            # Anda sedang membacanya!
```

## 🤝 Kontribusi

Kontribusi dipersilakan! Jika Anda memiliki ide untuk fitur baru, perbaikan bug, atau peningkatan, jangan ragu untuk membuka *issue* atau mengirimkan *pull request*.

## 📜 Lisensi

Proyek ini dilisensikan di bawah **Lisensi MIT**. Lihat file `LICENSE` untuk detail lebih lanjut.
