# PRODUCT REQUIREMENTS DOCUMENT (PRD) - UPDATED

**Nama Produk:** ReclaWatch: Sistem Informasi Pemantauan Progres Reklamasi Pertambangan
**Fase:** Prototipe Awal (Minimum Viable Product / MVP)  
**Karakteristik:** Role-Based Access Control (RBAC) dengan Alur Validasi (*Four-Eyes Principle*)

---

## 1. Tujuan Produk (Objective)
Membangun platform *dashboard* interaktif berbasis spasial untuk memantau, melaporkan, dan mengevaluasi progres kegiatan reklamasi lahan pascatambang secara *real-time*. Sistem ini bertujuan menggantikan pelaporan manual, menekan risiko ketidaksesuaian data lapangan, dan memberikan peringatan dini (*early warning*) terhadap lahan yang belum direklamasi sesuai target. Penerapan alur validasi antara lapangan dan manajemen dirancang untuk memastikan akurasi data sebelum pelaporan ke instansi pemerintah.

## 2. Target Pengguna (User Persona)

| Peran (*Role*) | Akses & Tanggung Jawab Utama |
| :--- | :--- |
| **Admin Sistem** | Pengendali utama sistem yang mengelola data master lahan, batas poligon konsesi awal di peta, dan manajemen akun pengguna. |
| **Surveyor (Lapangan)** | Aktor lapangan yang melakukan inspeksi, memasukkan data realisasi fisik (hektar, tahapan), dan mengunggah foto ber-geotag sebagai bukti. |
| **Manajemen / Auditor** | Verifikator data yang bertugas memeriksa dan menyetujui klaim progres dari Surveyor, serta memantau *dashboard* untuk pelaporan. |

---

## 3. Kebutuhan Fungsional (User Stories)

Sistem dibagi menjadi modul-modul spesifik berdasarkan hak akses aktor:

### A. Halaman Khusus Admin Sistem (Desktop View)
* **Manajemen Pengguna (User Management):** Sebagai Admin, saya ingin bisa membuat, mengubah, dan menghapus akun Surveyor dan Auditor, serta memetakan wilayah tugas masing-masing Surveyor.
* **Manajemen Data Spasial & Lahan:** Sebagai Admin, saya ingin bisa mengunggah file spasial (format GeoJSON/Polygon) berisi batas wilayah konsesi dan menetapkan target luasan RKAB pada masing-masing blok lahan tersebut agar area terlihat di atas *basemap*.
* **Pengaturan SLA (Tenggat Waktu):** Sebagai Admin, saya ingin mengatur batas waktu penyelesaian setiap tahapan reklamasi untuk memicu peringatan otomatis di sistem.

### B. Halaman Khusus Surveyor (Mobile-Responsive View)
* **Daftar Tugas (Task List):** Sebagai Surveyor, saya ingin melihat daftar blok lahan tambang yang menjadi tanggung jawab inspeksi saya, lengkap dengan *deadline* pelaporan.
* **Form Pelaporan Lapangan:** Sebagai Surveyor, saya ingin mengisi formulir responsif dari perangkat seluler yang memuat tahapan reklamasi (Penataan, Tanah Pucuk, Erosi, Revegetasi) dan luasan lahan yang dikerjakan.
* **Kamera & Geotagging:** Sebagai Surveyor, saya ingin memotret bukti lapangan langsung dari aplikasi, di mana sistem otomatis mengekstrak koordinat GPS dan stempel waktu dari foto tersebut untuk mencegah manipulasi lokasi.
* **Riwayat Input:** Sebagai Surveyor, saya ingin melihat daftar laporan yang telah saya kirimkan beserta statusnya (*Pending*, *Approved*, atau *Rejected*).

### C. Halaman Khusus Auditor / Manajemen (Desktop View)
* **Meja Kerja Validasi (Approval Desk):** Sebagai Auditor, saya ingin melihat antrean laporan *Pending* dari Surveyor. Saya harus bisa membandingkan luasan target vs realisasi, mengecek foto lapangan, dan menekan tombol **"Setujui (Approve)"** atau **"Tolak (Reject)"**.
* **Peta WebGIS:** Sebagai Auditor, saya ingin melihat peta yang warna poligonnya otomatis berubah berdasarkan status terkini, **hanya setelah** data disetujui (Merah: Bukaan baru/Tertunda, Kuning: Sedang dikerjakan, Hijau: Revegetasi selesai).
* **Log Aktivitas (Audit Trail):** Sebagai Auditor, saya ingin melihat rekam jejak riwayat pelaporan dan validasi untuk transparansi (*siapa melakukan apa dan kapan*).
* **Eksekutif Dashboard & Generator Laporan:** Sebagai Manajemen, saya ingin melihat grafik interaktif (*bar/line chart*) perbandingan target tahunan vs realisasi berjalan, dan bisa menekan tombol "Export Report" untuk menghasilkan dokumen PDF/Excel.

---

## 4. Panduan UI/UX (Desain)

Pengembangan antarmuka harus mematuhi komposisi warna **60-30-10** untuk menghindari kelelahan mata pengguna saat membaca data spasial yang padat.

* **60% Warna Dominan (Putih / Off-White):** Digunakan sebagai warna latar belakang utama area kerja, *form*, dan *card* pembungkus grafik untuk memberikan ruang bernapas (*white space*).
* **30% Warna Sekunder (Biru / Biru Gelap):** Digunakan pada area navigasi (*sidebar*), teks utama, tabel, dan *header* halaman.
* **10% Warna Aksen (Emas / Merah):** Digunakan secara eksklusif untuk tombol aksi krusial (*Call to Action* seperti "Simpan", "Approve", atau "Export") dan sebagai warna poligon pada peta untuk menandai status peringatan atau progres berjalan.
* **Tata Letak Peta:** Elemen WebGIS minimal mengambil porsi 60% dari area *dashboard*, memusatkan fokus pada visualisasi lokasi.

---

## 5. Arsitektur & Teknologi (Tech Stack)

Sistem ini dikembangkan menggunakan **Framework CodeIgniter 3** dengan spesifikasi sebagai berikut:

| Lapisan (Layer) | Teknologi yang Digunakan | Fungsi Spesifik |
| :--- | :--- | :--- |
| **Frontend** | CodeIgniter 3 Views, Bootstrap 4/5, jQuery, Leaflet.js | Membangun tampilan UI dengan template engine bawaan CI3, *styling* responsif menggunakan Bootstrap, dan *rendering* peta spasial interaktif. |
| **Backend** | CodeIgniter 3 (MVC Pattern) | Menjalankan logika kalkulasi progres, autentikasi sesi pengguna (session-based), dan memproses data koordinat menggunakan Controller & Model. |
| **Database** | MySQL | Menyimpan tabel relasional, riwayat log, dan mendukung tipe data spasial (`GEOMETRY`/`POLYGON`). |
| **Server** | Linux (Ubuntu) / XAMPP | Infrastruktur *hosting* untuk menjalankan *web server* dan basis data sistem. |

**Struktur MVC CodeIgniter 3:**

| Komponen | Fungsi |
| :--- | :--- |
| **Controllers** | `Auth.php`, `Admin.php`, `Surveyor.php`, `Auditor.php`, `Report.php` |
| **Models** | `User_model.php`, `Lahan_model.php`, `Laporan_model.php`, `Validasi_model.php`, `Log_model.php` |
| **Views** | `admin/*`, `surveyor/*`, `auditor/*`, `templates/*` (header, sidebar, footer) |

**Kalkulasi Logika Backend:**
Backend harus menghitung persentase keberhasilan setiap kali Auditor menekan *Approve* pada data baru dengan rumus:

$$
\text{Persentase Progres} = \left( \frac{\text{Luas Lahan Realisasi}}{\text{Luas Target RKAB}} \right) \times 100\%
$$

---

## 6. Kriteria Penerimaan (Acceptance Criteria)

Fitur pada MVP dianggap berhasil dan siap diuji coba (*User Acceptance Testing*) apabila memenuhi syarat berikut:
1. **Master Data:** Admin berhasil memetakan wilayah konsesi (GeoJSON) dan menetapkan target di *database*.
2. **Pelaporan:** Surveyor dapat berhasil melakukan *login*, mengisi *form* di lapangan, mengunggah foto ber-geotag, dan menyimpannya ke *database* dengan status *Pending*.
3. **Validasi & Kalkulasi:** Auditor memberikan *Approve* pada laporan. Sistem otomatis memicu fungsi PHP di *backend* untuk menghitung persentase baru, mencatat log aktivitas, dan angka tersebut langsung berubah di grafik dasbor.
4. **Visualisasi Peta:** Poligon lahan pada peta WebGIS berhasil berubah warna menjadi Hijau secara otomatis saat persentase progres mencapai 100% pasca-validasi.
5. **Responsivitas:** Tata letak UI konsisten dan tidak berantakan saat dibuka melalui layar *desktop* (Admin/Auditor) maupun perangkat *mobile* (Surveyor).

---

## 7. Implementasi CodeIgniter 3 - Struktur Direktori

```
application/
├── config/
│   ├── autoload.php
│   ├── config.php
│   ├── database.php
│   └── routes.php
├── controllers/
│   ├── Auth.php
│   ├── Admin.php
│   ├── Surveyor.php
│   └── Auditor.php
├── models/
│   ├── User_model.php
│   ├── Lahan_model.php
│   ├── Laporan_model.php
│   ├── Validasi_model.php
│   └── Log_model.php
├── views/
│   ├── templates/
│   │   ├── header.php
│   │   ├── sidebar.php
│   │   └── footer.php
│   ├── admin/
│   │   ├── dashboard.php
│   │   ├── users.php
│   │   └── lahan.php
│   ├── surveyor/
│   │   ├── dashboard.php
│   │   ├── form_laporan.php
│   │   └── riwayat.php
│   └── auditor/
│       ├── dashboard.php
│       ├── validasi.php
│       └── log_aktivitas.php
├── libraries/
│   └── (custom libraries)
└── helpers/
    └── (custom helpers)
```

---

## 8. Database Schema (MySQL)

```sql
-- Tabel Users
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255),
    email VARCHAR(100),
    role ENUM('admin','surveyor','auditor'),
    nama_lengkap VARCHAR(100),
    wilayah_tugas VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Lahan
CREATE TABLE lahan (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nama_blok VARCHAR(100),
    geometri POLYGON,
    target_rkab DECIMAL(10,2),
    status ENUM('tertunda','dikerjakan','selesai') DEFAULT 'tertunda',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Laporan
CREATE TABLE laporan (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lahan_id INT,
    surveyor_id INT,
    luasan_realisasi DECIMAL(10,2),
    tahapan ENUM('penataan','tanah_pucuk','erosi','revegetasi'),
    foto_path VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lahan_id) REFERENCES lahan(id),
    FOREIGN KEY (surveyor_id) REFERENCES users(id)
);

-- Tabel Validasi
CREATE TABLE validasi (
    id INT PRIMARY KEY AUTO_INCREMENT,
    laporan_id INT,
    auditor_id INT,
    status ENUM('approved','rejected'),
    catatan TEXT,
    progress_persen DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (laporan_id) REFERENCES laporan(id),
    FOREIGN KEY (auditor_id) REFERENCES users(id)
);

-- Tabel Log Aktivitas
CREATE TABLE log_aktivitas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    aksi VARCHAR(100),
    detail TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 9. Daftar Library & Plugin yang Direkomendasikan

| Keperluan | Library/Plugin | Fungsi |
| :--- | :--- | :--- |
| **Template UI** | Bootstrap 4/5, AdminLTE 3 | Tampilan dashboard profesional dan responsif |
| **Peta Interaktif** | Leaflet.js, Leaflet GeoJSON | Visualisasi spasial dan manipulasi poligon |
| **Form & Validasi** | jQuery Validation | Validasi form di sisi client |
| **Export Data** | Dompdf / PHPExcel | Generate PDF dan Excel |
| **Upload File** | CodeIgniter Upload Library | Manajemen upload foto dan GeoJSON |
| **Grafik** | Chart.js | Visualisasi data dashboard |
| **Geotagging** | EXIF PHP Extension | Ekstrak metadata GPS dari foto |

---

## 10. Catatan Implementasi untuk Developer

1. **Autentikasi:** Gunakan session-based authentication bawaan CodeIgniter 3 dengan helper `session`.
2. **RBAC:** Implementasikan dengan membuat `MY_Controller` sebagai base controller yang mengecek role user di setiap method.
3. **GeoJSON:** Untuk penyimpanan spasial, gunakan tipe data `GEOMETRY` di MySQL dan proses dengan query spatial (ST_AsGeoJSON, ST_GeomFromGeoJSON).
4. **Upload Photo:** Pastikan folder `uploads/` memiliki permission yang benar untuk menyimpan file.
5. **Mobile Responsive:** Gunakan class Bootstrap (`col-sm-`, `col-md-`) untuk tampilan yang responsif di perangkat mobile.
6. **Security:** Terapkan CSRF protection (aktifkan di `config.php`) dan XSS filtering untuk semua input.