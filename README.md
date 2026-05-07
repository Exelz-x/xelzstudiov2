# XelzStudio — Roblox Audio Converter

Website konverter audio untuk Roblox. Paste link YouTube → Download MP3 yang sudah diproses untuk Roblox.

---

## 📋 PANDUAN DEPLOYMENT LENGKAP (Untuk Pemula)

Panduan ini akan membawamu dari **nol** hingga website **live** di internet. Ikuti step by step.

---

## 🧰 STEP 1 — Install Tools yang Dibutuhkan

### 1A. Install Node.js
1. Buka browser → pergi ke **https://nodejs.org**
2. Klik tombol hijau besar **"LTS"** (versi stabil)
3. Download dan jalankan installernya
4. Klik Next → Next → Install → Finish
5. **Verifikasi:** Buka Command Prompt (Windows: tekan `Win+R`, ketik `cmd`, Enter)
   ```
   node --version
   npm --version
   ```
   Jika muncul versi seperti `v20.x.x`, berarti berhasil ✅

### 1B. Install Visual Studio Code
1. Buka browser → pergi ke **https://code.visualstudio.com**
2. Klik tombol **"Download for Windows"** (atau sesuai OS-mu)
3. Jalankan installer → Next → Install → Finish

### 1C. Install Git
1. Buka browser → pergi ke **https://git-scm.com/downloads**
2. Klik **"Download for Windows"**
3. Jalankan installer → gunakan semua settingan default → Install
4. **Verifikasi:** Di Command Prompt, ketik:
   ```
   git --version
   ```
   Harus muncul versi Git ✅

### 1D. Install FFmpeg (WAJIB untuk audio processing)
1. Buka browser → pergi ke **https://ffmpeg.org/download.html**
2. Klik **"Windows"** → Klik **"Windows builds from gyan.dev"**
3. Download file **`ffmpeg-release-essentials.zip`** (versi release terbaru)
4. Ekstrak zip tersebut ke folder `C:\ffmpeg`
5. **Tambahkan ke PATH:**
   - Tekan `Win+S` → cari **"Environment Variables"** → klik **"Edit the system environment variables"**
   - Klik tombol **"Environment Variables..."**
   - Di bagian **"System variables"**, cari dan klik **"Path"** → klik **"Edit"**
   - Klik **"New"** → ketik `C:\ffmpeg\bin` → OK → OK → OK
6. **Verifikasi** (buka Command Prompt BARU):
   ```
   ffmpeg -version
   ```
   Harus muncul info FFmpeg ✅

---

## 🐱 STEP 2 — Buat Akun GitHub

1. Buka **https://github.com** → klik **"Sign up"**
2. Isi email, password, username-mu
3. Verifikasi email yang dikirim ke inbox-mu
4. Kamu sekarang punya akun GitHub ✅

---

## 📁 STEP 3 — Buat Repository di GitHub

1. Login ke GitHub
2. Klik tombol **"+"** di pojok kanan atas → **"New repository"**
3. Isi:
   - **Repository name:** `xelzstudio`
   - **Description:** `Roblox Audio Converter`
   - Pilih **"Public"**
   - **JANGAN** centang "Add a README file"
4. Klik **"Create repository"**
5. GitHub akan menampilkan halaman repo kosong. Simpan URL-nya (contoh: `https://github.com/USERNAMEMU/xelzstudio`) ✅

---

## 💻 STEP 4 — Setup Project di Komputer

1. Buka **Command Prompt** atau **Terminal**
2. Navigasi ke folder yang kamu inginkan (contoh Desktop):
   ```
   cd Desktop
   ```
3. **Copy folder project ini** ke Desktop (folder bernama `xelzstudio`)
4. Masuk ke folder project:
   ```
   cd xelzstudio
   ```
5. Install semua dependencies:
   ```
   npm install
   ```
   Tunggu sampai selesai (mungkin 1-2 menit) ✅

---

## 🚀 STEP 5 — Upload ke GitHub

Di dalam folder `xelzstudio`, jalankan perintah ini satu per satu:

```bash
git init
git add .
git commit -m "Initial commit - XelzStudio"
git branch -M main
git remote add origin https://github.com/USERNAMEMU/xelzstudio.git
git push -u origin main
```

⚠️ **Ganti `USERNAMEMU`** dengan username GitHub-mu yang sesungguhnya.

GitHub akan meminta login → masukkan username dan password (atau token) GitHub-mu.

Setelah selesai, refresh halaman GitHub-mu → kamu akan melihat semua file ter-upload ✅

---

## ▲ STEP 6 — Deploy ke Vercel (Hosting Gratis)

### 6A. Buat Akun Vercel
1. Buka **https://vercel.com**
2. Klik **"Sign Up"** → pilih **"Continue with GitHub"**
3. Authorize Vercel untuk mengakses GitHub-mu
4. Kamu sekarang login ke Vercel dengan akun GitHub ✅

### 6B. Import Project dari GitHub
1. Di dashboard Vercel, klik **"Add New..."** → **"Project"**
2. Di daftar repository, cari **"xelzstudio"** → klik **"Import"**
3. Di halaman konfigurasi:
   - **Framework Preset:** pilih **"Other"** (bukan Next.js atau apapun)
   - **Root Directory:** biarkan kosong (titik `.`)
   - **Build Command:** kosongkan
   - **Output Directory:** kosongkan
   - **Install Command:** `npm install`
4. Klik **"Deploy"** 🚀

### 6C. Tunggu Deploy
- Vercel akan otomatis build dan deploy websitemu
- Prosesnya sekitar 1-3 menit
- Setelah selesai, kamu akan mendapat URL seperti: `https://xelzstudio-xxxxx.vercel.app`

### 6D. Akses Website
- Klik URL yang diberikan Vercel
- Website XelzStudio-mu sudah **LIVE** di internet! 🎉

---

## 🌐 STEP 7 — (Opsional) Custom Domain

Jika ingin domain seperti `xelzstudio.com`:
1. Beli domain di **Niagahoster**, **Namecheap**, atau **GoDaddy**
2. Di Vercel → project-mu → **"Settings"** → **"Domains"**
3. Tambahkan domain-mu → ikuti instruksi DNS yang diberikan Vercel

---

## 🔧 STEP 8 — Update Website di Masa Depan

Setiap kali kamu ingin mengubah website:
1. Edit file di VS Code
2. Buka terminal di folder project:
   ```
   git add .
   git commit -m "Describe your changes"
   git push
   ```
3. Vercel otomatis **re-deploy** dalam 1-2 menit! ✅

---

## 🛡️ FITUR KEAMANAN YANG SUDAH TERPASANG

| Fitur | Keterangan |
|-------|-----------|
| Helmet.js | Security headers (CSP, HSTS, X-Frame, dll) |
| Rate Limiting | Max 10 konversi/jam, 100 request/15 menit per IP |
| Input Validation | URL YouTube divalidasi ketat |
| Auto File Cleanup | File temp dihapus otomatis tiap 10 menit |
| HTTPS | Otomatis dari Vercel |
| DDoS Protection | Rate limiter per IP + Vercel Edge |
| No Data Storage | Tidak ada database, tidak ada penyimpanan user data |

---

## 📂 STRUKTUR FOLDER

```
xelzstudio/
├── server.js          ← Backend utama (Node.js + Express)
├── vercel.json        ← Konfigurasi Vercel
├── package.json       ← Dependencies
├── .gitignore         ← File yang tidak di-upload ke GitHub
├── .env.example       ← Contoh environment variables
└── public/
    ├── index.html     ← Halaman utama
    ├── privacy.html   ← Privacy Policy
    ├── terms.html     ← Terms of Service
    ├── faq.html       ← FAQ
    ├── 404.html       ← Halaman error 404
    ├── css/
    │   └── style.css  ← Semua styling
    ├── js/
    │   └── main.js    ← Frontend JavaScript
    └── assets/
        └── favicon.svg
```

---

## ❓ MASALAH UMUM & SOLUSI

**"ffmpeg not found" error:**
→ Pastikan kamu sudah menambahkan `C:\ffmpeg\bin` ke PATH dan buka terminal BARU

**"npm not found":**
→ Reinstall Node.js dari https://nodejs.org

**Deploy gagal di Vercel:**
→ Cek tab "Build Logs" di Vercel untuk melihat error spesifiknya

**Konversi gagal (video not available):**
→ Video mungkin private, age-restricted, atau region-locked. Coba video lain.

**Rate limit error:**
→ Tunggu 1 jam sebelum mencoba lagi (limit: 10 konversi/jam)

---

## 📞 Support

Untuk pertanyaan: buat Issue di GitHub repository ini.
