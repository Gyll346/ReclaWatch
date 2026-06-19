import json
import sys
import numpy as np
from sklearn.linear_model import LinearRegression

def hitung_estimasi():
    # X = Riwayat bulan pengamatan (Bulan ke-1 sampai ke-5)
    X = np.array([1, 2, 3, 4, 5]).reshape(-1, 1)
    # Y = Persentase kerapatan vegetasi hasil input lapangan
    Y = np.array([12, 18, 26, 32, 41])

    # Inisialisasi dan latih model Regresi Linear
    model = LinearRegression()
    model.fit(X, Y)

    # Rumus Regresi Linear: Y = mX + c
    m = model.coef_[0]
    c = model.intercept_

    # Kita mau cari tahu kapan Y (Kerapatan) menyentuh target nilai 100%
    # Rumus mencari X: X = (Y - c) / m
    target_y = 100
    bulan_target_selesai = (target_y - c) / m
    
    # Hitung sisa bulan dari bulan pengamatan terakhir (Bulan ke-5)
    sisa_bulan = max(0, round(bulan_target_selesai - 5, 1))

    # Siapkan data historis dan proyeksi masa depan untuk grafik frontend
    tahun_grafik = ["2026", "2027", "2028", "2029", "2030"]
    tren_pertumbuhan = [15, 35, 55, 80, 100] # Estimasi kecenderungan angka kenaikan

    # Bungkus hasil ke dalam dictionary/JSON
    output_data = {
        "status": "success",
        "akurasi_r2": round(model.score(X, Y) * 100, 2), # Persentase kecocokan model
        "kecepatan_tumbuh_per_bulan_persen": round(m, 2),
        "estimasi_selesai_bulan_lagi": sisa_bulan,
        "grafik_tahun": tahun_grafik,
        "grafik_data": tren_pertumbuhan
    }

    # Cetak hasil agar bisa ditangkap oleh PHP shell_exec
    print(json.dumps(output_data))

if __name__ == "__main__":
    hitung_estimasi()