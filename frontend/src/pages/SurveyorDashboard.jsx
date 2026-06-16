import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { ClipboardList, FilePlus2, History, LogOut, CheckCircle2, XCircle, Clock, Navigation, Camera, AlertTriangle } from 'lucide-react';

export default function SurveyorDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(true);

  // Data States
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);

  // Form States
  const [selectedLahan, setSelectedLahan] = useState('');
  const [tahapan, setTahapan] = useState('Penataan Lahan');
  const [luasRealisasi, setLuasRealisasi] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Geolocation States
  const [deviceGps, setDeviceGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Status/Toast States
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch initial surveyor data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, historyRes] = await Promise.all([
        axios.get('/surveyor_tasks'),
        axios.get('/surveyor_history')
      ]);
      setTasks(tasksRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error('Error fetching surveyor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Request browser geolocation fallback
  const requestDeviceGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser Anda tidak mendukung Geolocation.');
      return;
    }

    setGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeviceGps({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setGpsLoading(false);
      },
      (error) => {
        let msg = 'Gagal mengakses GPS perangkat.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Izin GPS ditolak. Silakan aktifkan GPS perangkat Anda.';
        }
        setGpsError(msg);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Trigger GPS retrieval when entering Report Form or when selecting photo
  useEffect(() => {
    if (activeTab === 'new-report') {
      requestDeviceGps();
    }
  }, [activeTab]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.match('image/jpeg') && !file.type.match('image/jpg')) {
      setFormError('Hanya foto dengan format JPG/JPEG yang diperbolehkan agar stempel EXIF dapat terbaca.');
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }

    setFormError('');
    setPhoto(file);
    
    // Create image preview url
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Refresh GPS coordinates for absolute fallback safety
    requestDeviceGps();
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedLahan) {
      setFormError('Pilih blok lahan tugas terlebih dahulu.');
      return;
    }
    if (!luasRealisasi || parseFloat(luasRealisasi) <= 0) {
      setFormError('Masukkan luas realisasi fisik yang valid (> 0 Ha).');
      return;
    }
    if (!photo) {
      setFormError('Unggah foto lapangan sebagai bukti fisik.');
      return;
    }

    setSubmitting(true);

    // Prepare Multipart Form Data
    const formData = new FormData();
    formData.append('lahan_id', selectedLahan);
    formData.append('tahapan', tahapan);
    formData.append('luas_realisasi', luasRealisasi);
    formData.append('foto', photo);

    // Attach device GPS if available
    if (deviceGps) {
      formData.append('latitude', deviceGps.latitude);
      formData.append('longitude', deviceGps.longitude);
    }

    try {
      await axios.post('/surveyor_report', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setFormSuccess('Laporan berhasil dikirim dan menunggu validasi auditor.');
      
      // Reset Form states
      setSelectedLahan('');
      setTahapan('Penataan Lahan');
      setLuasRealisasi('');
      setPhoto(null);
      setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh data lists
      const [tasksRes, historyRes] = await Promise.all([
        axios.get('/surveyor_tasks'),
        axios.get('/surveyor_history')
      ]);
      setTasks(tasksRes.data);
      setHistory(historyRes.data);

      // Switch to history tab after 2 seconds
      setTimeout(() => {
        setActiveTab('history');
        setFormSuccess('');
      }, 2000);

    } catch (err) {
      setFormError(err.response?.data?.error || 'Gagal mengirim laporan lapangan.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper mapping values
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
            <XCircle className="w-3.5 h-3.5" /> Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-primaryBg flex flex-col pb-16 md:pb-0">
      {/* Top Mobile-Responsive Navbar */}
      <header className="h-16 bg-secondaryNavy text-white flex items-center justify-between px-4 sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-gradient-to-tr from-accentGold to-amber-400 flex items-center justify-center font-black text-secondaryNavy-dark text-base shadow">
            RW
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide leading-none">RECLAWATCH</h1>
            <span className="text-[9px] text-slate-400 uppercase font-semibold">Surveyor Panel</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden xs:block">
            <div className="font-bold text-xs leading-none">{user?.username}</div>
            <div className="text-[9px] text-slate-400 mt-0.5">ID Surveyor: {user?.id}</div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
            title="Keluar"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Area */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-accentGold animate-spin"></div>
          <span className="mt-3 text-slate-500 font-medium text-xs">Memuat tugas lapangan...</span>
        </div>
      ) : (
        <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-4">
          
          {/* TAB 1: TASK LIST */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-slate-800 text-base">Tugas Inspeksi Anda</h2>
                <span className="text-xs text-slate-400 font-medium">Total: {tasks.length} Lahan</span>
              </div>

              {tasks.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  Anda belum mendapatkan penugasan blok lahan.
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.assignment_id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 relative overflow-hidden">
                    {/* SLA Warning Badge */}
                    {task.sla_warning && (
                      <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider flex items-center gap-1 pulse-warn">
                        <AlertTriangle className="w-3.5 h-3.5" /> Overdue (Terlambat)
                      </div>
                    )}

                    <div>
                      <h3 className="font-bold text-slate-800 text-base pr-24 truncate">{task.nama_blok}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Ditugaskan pada: {new Date(task.assigned_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-100 py-2.5">
                      <div>
                        <div className="text-slate-400">Target RKAB:</div>
                        <div className="font-bold text-slate-700 mt-0.5">{Number(task.target_luas).toFixed(2)} Ha</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Total Realisasi Disetujui:</div>
                        <div className="font-bold text-slate-700 mt-0.5">{Number(task.total_realisasi).toFixed(2)} Ha</div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-500">Progres Lahan:</span>
                        <span className={task.progress_percentage >= 100 ? 'text-accentGreen-dark' : 'text-accentGold'}>
                          {Number(task.progress_percentage).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${task.progress_percentage >= 100 ? 'bg-accentGreen' : 'bg-accentGold'}`}
                          style={{ width: `${Math.min(100, task.progress_percentage)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 text-[11px]">
                      <span className="text-slate-400 font-medium">Batas Waktu SLA: <strong className="text-slate-600">{new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                      
                      {task.progress_percentage < 100 && (
                        <button
                          onClick={() => {
                            setSelectedLahan(task.lahan_id);
                            setActiveTab('new-report');
                          }}
                          className="px-3 py-1.5 bg-accentGold text-secondaryNavy-dark font-bold rounded-lg shadow-sm hover:bg-opacity-95 transition"
                        >
                          Kirim Laporan
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: REPORT SUBMISSION FORM */}
          {activeTab === 'new-report' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
              <div>
                <h2 className="font-bold text-slate-800 text-lg">Buat Laporan Lapangan</h2>
                <p className="text-xs text-slate-400 mt-0.5">Unggah bukti foto ber-geotag beserta tahapan kegiatan reklamasi.</p>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Select Lahan Block */}
                <div>
                  <label className="block text-slate-500 text-xs font-semibold uppercase mb-1">Blok Lahan Inspeksi</label>
                  <select
                    value={selectedLahan}
                    onChange={(e) => setSelectedLahan(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-accentGold rounded-lg text-sm text-slate-800 outline-none cursor-pointer"
                    required
                  >
                    <option value="">-- Pilih Blok Tugas --</option>
                    {tasks.map(t => (
                      <option key={t.lahan_id} value={t.lahan_id}>{t.nama_blok} (Target: {Number(t.target_luas).toFixed(1)} Ha)</option>
                    ))}
                  </select>
                </div>

                {/* Select Stage */}
                <div>
                  <label className="block text-slate-500 text-xs font-semibold uppercase mb-1">Tahap Reklamasi</label>
                  <select
                    value={tahapan}
                    onChange={(e) => setTahapan(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-accentGold rounded-lg text-sm text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="Penataan Lahan">Penataan Lahan</option>
                    <option value="Penyebaran Tanah Pucuk">Penyebaran Tanah Pucuk</option>
                    <option value="Pengendalian Erosi">Pengendalian Erosi</option>
                    <option value="Revegetasi">Revegetasi</option>
                  </select>
                </div>

                {/* Luas Realisasi */}
                <div>
                  <label className="block text-slate-500 text-xs font-semibold uppercase mb-1">Luas Realisasi Fisik (Hektar)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={luasRealisasi}
                    onChange={(e) => setLuasRealisasi(e.target.value)}
                    placeholder="contoh: 2.75"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-accentGold rounded-lg text-sm text-slate-800 outline-none transition"
                    required
                  />
                </div>

                {/* Geotagging GPS Fallback Info */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-accentGold" /> GPS Perangkat Fallback
                    </span>
                    <button
                      type="button"
                      onClick={requestDeviceGps}
                      disabled={gpsLoading}
                      className="text-[10px] font-bold text-accentGold hover:underline disabled:text-slate-400"
                    >
                      {gpsLoading ? 'Melacak...' : 'Refresh GPS'}
                    </button>
                  </div>

                  {deviceGps ? (
                    <div className="text-xs text-slate-700 font-medium bg-emerald-500/10 border border-emerald-500/20 rounded p-2 flex justify-between">
                      <span>Lat: {deviceGps.latitude.toFixed(6)}</span>
                      <span>Lng: {deviceGps.longitude.toFixed(6)}</span>
                      <span className="text-[10px] text-emerald-600 font-bold">Siap</span>
                    </div>
                  ) : gpsLoading ? (
                    <div className="text-xs text-slate-500 italic">Mendapatkan koordinat GPS terkini...</div>
                  ) : (
                    <div className="text-xs text-slate-400 italic flex items-center gap-1">
                      {gpsError ? (
                        <span className="text-red-500 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {gpsError}
                        </span>
                      ) : (
                        <span>GPS belum dikunci. Klik Refresh GPS atau unggah foto untuk memicu.</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Camera / Photo Upload input */}
                <div>
                  <label className="block text-slate-500 text-xs font-semibold uppercase mb-1">Foto Bukti Lapangan (JPG/JPEG)</label>
                  
                  {photoPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 mb-2 h-44 bg-slate-900 group">
                      <img src={photoPreview} alt="Preview Bukti Lapangan" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setPhoto(null);
                          setPhotoPreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute top-2 right-2 bg-slate-950/80 hover:bg-red-600 text-white rounded-full p-1.5 shadow transition"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-slate-300 rounded-xl hover:border-accentGold hover:bg-amber-50/10 flex flex-col items-center justify-center gap-2 text-slate-400 transition cursor-pointer"
                    >
                      <Camera className="w-8 h-8 text-slate-300" />
                      <span className="text-xs font-medium">Buka Kamera / Pilih Foto</span>
                      <span className="text-[10px] text-slate-400">Harus berformat .jpg / .jpeg</span>
                    </button>
                  )}
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".jpg,.jpeg"
                    capture="environment" // Forces back-camera on mobile devices
                    onChange={handlePhotoChange}
                    className="hidden"
                    required
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-accentGold disabled:bg-slate-700 text-secondaryNavy-dark font-bold text-sm tracking-wider rounded-xl transition duration-200 shadow shadow-amber-500/10 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-secondaryNavy-dark border-t-transparent animate-spin"></div>
                      <span>Mengirim Laporan...</span>
                    </>
                  ) : (
                    <span>KIRIM LAPORAN</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: INPUT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-800 text-base">Riwayat Pelaporan Lahan</h2>

              {history.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
                  <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  Belum ada riwayat laporan yang dikirimkan.
                </div>
              ) : (
                history.map((rep) => (
                  <div key={rep.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3.5">
                    
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{rep.nama_lahan}</h3>
                        <span className="inline-flex mt-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded">
                          {rep.tahapan}
                        </span>
                      </div>
                      {getStatusBadge(rep.status)}
                    </div>

                    <div className="flex gap-3 text-xs bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                      <img
                        src={`${axios.defaults.baseURL.replace(/\/index\.php\/api$/, '')}/${rep.foto_url}`}
                        alt="Bukti fisik"
                        className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-sm shrink-0"
                      />
                      <div className="space-y-1 text-slate-500">
                        <div>Luas Realisasi: <strong className="text-slate-700">{Number(rep.luas_realisasi).toFixed(2)} Ha</strong></div>
                        <div className="text-[10px] leading-tight">Geotag: <span className="font-mono text-slate-700">{Number(rep.latitude).toFixed(5)}, {Number(rep.longitude).toFixed(5)}</span></div>
                        <div className="text-[10px]">Tanggal GPS: {new Date(rep.geotag_timestamp).toLocaleDateString('id-ID')} {new Date(rep.geotag_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>

                    {/* Auditor Feedback / Comments */}
                    {rep.catatan_auditor && (
                      <div className="text-xs bg-amber-50/50 border border-amber-200/50 rounded-lg p-3">
                        <span className="font-bold text-amber-800 block mb-0.5 text-[10px] uppercase tracking-wide">
                          Catatan Auditor / Status Verifikasi:
                        </span>
                        <p className="text-slate-600 leading-normal">{rep.catatan_auditor}</p>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 text-right">
                      Dikirim pada: {new Date(rep.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>

                  </div>
                ))
              )}
            </div>
          )}

        </main>
      )}

      {/* Bottom Mobile Tab Bar Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around z-20 md:hidden">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center gap-1 py-1 text-xs font-semibold ${activeTab === 'tasks' ? 'text-accentGold' : 'text-slate-400'}`}
        >
          <ClipboardList className="w-5.5 h-5.5" />
          <span>Tugas</span>
        </button>
        
        <button
          onClick={() => setActiveTab('new-report')}
          className={`flex flex-col items-center gap-1 py-1 text-xs font-semibold ${activeTab === 'new-report' ? 'text-accentGold' : 'text-slate-400'}`}
        >
          <FilePlus2 className="w-5.5 h-5.5" />
          <span>Lapor</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 py-1 text-xs font-semibold ${activeTab === 'history' ? 'text-accentGold' : 'text-slate-400'}`}
        >
          <History className="w-5.5 h-5.5" />
          <span>Riwayat</span>
        </button>
      </footer>
    </div>
  );
}
