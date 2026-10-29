# FANBIL SHOWW — Showroom Mobil Curated (Tugas Akhir BTNG Kelas Frontend)

Website showroom mobil premium dan interaktif yang dibangun menggunakan **HTML5 semantik**, **Tailwind CSS**, dan **Vanilla JavaScript (Native)** dengan integrasi endpoint API resmi panitia BTNG DNCC UDINUS.

---

## 📌 Ketentuan Tugas & Aspek Penilaian

| No | Aspek Penilaian | Bobot | Implementasi di Proyek |
|---|---|:---:|---|
| 1 | **Tampilan & UI/UX** | **40%** | Desain luxury showroom bertema gelap (Dark Slate & Amber Gold), hierarki informasi jelas, micro-interactions, modal popup detail mobil, dan badge status visual. |
| 2 | **Integrasi API & DOM Manipulation** | **30%** | Mengambil data dari endpoint resmi via fungsi native `fetch()`, mengolah respons JSON, serta merender kartu mobil dinamis menggunakan manipulasi DOM (`createElement` & `DocumentFragment`). |
| 3 | **Responsivitas Website** | **20%** | Desain 100% responsif di layar mobile/smartphone, tablet, maupun desktop besar, dilengkapi hamburger menu navigasi mobile yang fleksibel. |
| 4 | **Kerapian Kode** | **10%** | Kode terstruktur rapi, modular, berformat semantik, tanpa error sintaks, dan disertai dokumentasi/komentar deskriptif. |

---

## 🔗 Endpoint API Resmi

- **URL Endpoint**: `https://api-web.dnccudinus.org/api/mobil`
- **Metode HTTP**: `GET`
- **Format Data**: JSON (`{ success: true, message: "...", data: [...] }`)
- **Properti Objek Mobil**:
  - `id`: ID unik mobil
  - `nama`: Nama lengkap model mobil
  - `brand`: Merek pabrikan (Toyota, Honda, BYD, Mazda, dll)
  - `harga`: Harga dalam Rupiah (diformat otomatis dengan `Intl.NumberFormat`)
  - `tahun`: Tahun pembuatan / rilis
  - `transmisi`: Matic, CVT, atau Manual
  - `bahan_bakar`: Listrik, Hybrid, Diesel, atau Bensin
  - `status`: `tersedia` atau `sold`
  - `foto`: URL foto resolusi tinggi Unsplash

---

## 🚀 Fitur Unggulan

1. **Integrasi API Dinamis & Real-time**:
   - Pengambilan data mobil otomatis saat halaman dibuka.
   - Dilengkapi *Skeleton Loader shimmer* modern selama proses fetching.
   - Dilengkapi *Error State* dan tombol *Muat Ulang* otomatis bila koneksi bermasalah.
2. **Katalog & Filter Multi-Kategori**:
   - Live Search pencarian instan berdasarkan nama dan merek unit.
   - Filter dropdown merek (di-generate otomatis dari data unik API).
   - Filter transmisi & tipe bahan bakar.
   - Filter status ketersediaan (*Tersedia* / *Sold*).
   - Fitur sortir berdasarkan harga termurah, harga tertinggi, tahun terbaru, dan abjad A–Z.
   - Tombol reset filter instan.
3. **Modal Popup Detail Spesifikasi**:
   - Tampilan foto mobil beresolusi tinggi.
   - Rincian spesifikasi lengkap (Tahun, Transmisi, Bahan Bakar, ID Unit).
   - Simulasi estimasi DP 20% dan cicilan.
   - Direct button WhatsApp dengan pesan otomatis terisi sesuai nama unit & harga.
   - Direct button "Jadwalkan Test Drive" yang mengarahkan ke form kontak.
4. **Halaman Pendukung**:
   - `index.html`: Showcase beranda, statistik live counter, brand pills, unit highlight.
   - `katalog.html`: Koleksi lengkap dengan toolbar filter dan result counter.
   - `tentang.html`: Cerita showroom, standar inspeksi 160 titik, dan komitmen.
   - `kontak.html`: Formulir reservasi kunjungan & test drive interaktif.

---

## 📁 Struktur Direktori

```text
BTNGGIT/
├── index.html        # Halaman utama / Showcase Showroom
├── katalog.html      # Halaman katalog unit & filter lengkap
├── tentang.html      # Halaman profil & standar showroom
├── kontak.html       # Halaman reservasi test drive & alamat showroom
├── app.js            # Vanilla JS: Fetch API, filter, sort, modal, DOM manipulation
├── style.css         # Custom CSS: font import, scrollbar, ambient glow
├── js/
│   └── app.js        # File mirror script (kompatibilitas path)
├── css/
│   └── style.css      # File mirror styling (kompatibilitas path)
└── README.md         # Dokumentasi proyek
```

---

## 💻 Cara Menjalankan Proyek

1. Unduh atau clone repository ini:
   ```bash
   git clone https://github.com/<username>/BTNG-Frontend-<NamaLengkap>.git
   ```
2. Buka folder proyek di teks editor (VS Code, Cursor, dll).
3. Jalankan file `index.html` langsung di browser Anda:
   - Double-click file `index.html`, atau
   - Klik kanan `index.html` lalu pilih **Open with Live Server**.
4. Pastikan koneksi internet aktif agar pemanggilan ke API `https://api-web.dnccudinus.org/api/mobil` dan resource CDN berjalan lancar.
