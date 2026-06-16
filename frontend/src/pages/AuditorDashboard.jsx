import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
import { LayoutDashboard, CheckSquare, Shield, FileSpreadsheet, AlertCircle, Check, X, FileText, Download, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

export default function AuditorDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Data States from Backend API
  const [stats, setStats] = useState({});
  const [lahanMap, setLahanMap] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [stagesProgress, setStagesProgress] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);

  // Modal / Input States for Validation
  const [validatingId, setValidatingId] = useState(null);
  const [validationComment, setValidationComment] = useState('');
  const [validationAction, setValidationAction] = useState(''); // 'Approved' or 'Rejected'
  const [validationError, setValidationError] = useState('');
  const [validationSuccess, setValidationSuccess] = useState('');

  // Fetch all initial Auditor Dashboard data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, pendingRes] = await Promise.all([
        axios.get('/auditor_dashboard'),
        axios.get('/auditor_pending'),
      ]);
      
      setStats(dashRes.data.stats);
      setLahanMap(dashRes.data.lahan_map);
      setAuditLogs(dashRes.data.audit_logs);
      setStagesProgress(dashRes.data.stages_progress);
      setPendingReports(pendingRes.data);
    } catch (err) {
      console.error('Error fetching auditor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleValidationSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setValidationSuccess('');

    if (!validatingId) return;

    try {
      const response = await axios.post('/auditor_validate', {
        laporan_id: validatingId,
        action: validationAction,
        catatan_auditor: validationComment
      });

      setValidationSuccess(`Laporan berhasil di-${validationAction === 'Approved' ? 'Setujui' : 'Tolak'}.`);
      setValidationComment('');
      setValidatingId(null);

      // Refresh data
      const [dashRes, pendingRes] = await Promise.all([
        axios.get('/auditor_dashboard'),
        axios.get('/auditor_pending'),
      ]);
      setStats(dashRes.data.stats);
      setLahanMap(dashRes.data.lahan_map);
      setAuditLogs(dashRes.data.audit_logs);
      setStagesProgress(dashRes.data.stages_progress);
      setPendingReports(pendingRes.data);
      
      setTimeout(() => setValidationSuccess(''), 3000);
    } catch (err) {
      setValidationError(err.response?.data?.error || 'Gagal memproses validasi laporan.');
    }
  };

  const startValidation = (id, action) => {
    setValidatingId(id);
    setValidationAction(action);
    setValidationComment('');
    setValidationError('');
  };

  const handlePrint = () => {
    window.print();
  };

  // Configuration for Charts
  const chartData = lahanMap.map(l => ({
    name: l.nama_blok,
    Target: parseFloat(l.target_luas),
    Realisasi: parseFloat(l.total_realisasi),
  }));

  const pieColors = ['#1e40af', '#3b82f6', '#10b981', '#f59e0b'];
  const stageData = stagesProgress.map((item, idx) => ({
    name: item.tahapan,
    value: parseFloat(item.total_luas),
    color: pieColors[idx % pieColors.length]
  }));

  const tabs = [
    { id: 'overview', label: 'Ringkasan & WebGIS', icon: LayoutDashboard },
    { id: 'validation', label: 'Meja Validasi', icon: CheckSquare },
    { id: 'audit', label: 'Log Aktivitas', icon: Shield },
    { id: 'export', label: 'Generator Laporan', icon: FileSpreadsheet },
  ];

  return (
    <div className="flex h-screen bg-primaryBg overflow-hidden print:bg-white print:h-auto print:overflow-visible">
      {/* Sidebar - Hidden on Print */}
      <div className="print:hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible">
        {/* Navbar - Hidden on Print */}
        <div className="print:hidden">
          <Navbar title="Dashboard Auditor & Manajemen" />
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center print:hidden">
            <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-accentGold animate-spin"></div>
            <span className="ml-3 text-slate-500 font-medium text-sm">Memuat dashboard auditor...</span>
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto p-6 space-y-6 print:p-0 print:overflow-visible">
            
            {/* validation feedback notification */}
            {validationSuccess && (
              <div className="print:hidden p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2 text-sm shadow-sm animate-bounce">
                <Check className="w-5 h-5" />
                <span>{validationSuccess}</span>
              </div>
            )}

            {/* TAB 1: EXECUTIVE DASHBOARD & WEBGIS */}
            {activeTab === 'overview' && (
              <div className="space-y-6 print:hidden">
                
                {/* 4 Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Lahan */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Blok Lahan</span>
                      <h3 className="font-extrabold text-slate-800 text-2xl mt-1">{stats.total_lahan}</h3>
                      <span className="text-[10px] font-medium text-slate-500 mt-0.5 block">Target RKAB: {Number(stats.total_target).toFixed(1)} Ha</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                      L
                    </div>
                  </div>

                  {/* Total Realisasi */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Realisasi Fisik</span>
                      <h3 className="font-extrabold text-slate-800 text-2xl mt-1">{Number(stats.total_realisasi).toFixed(1)} <span className="text-sm font-semibold text-slate-500">Ha</span></h3>
                      <span className="text-[10px] font-medium text-slate-500 mt-0.5 block">Telah diverifikasi auditor</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                      R
                    </div>
                  </div>

                  {/* Progress Overall */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Persentase Sukses</span>
                      <h3 className="font-extrabold text-slate-800 text-2xl mt-1">{Number(stats.overall_percentage).toFixed(1)}%</h3>
                      <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-accentGold rounded-full"
                          style={{ width: `${Math.min(100, stats.overall_percentage)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-accentGold flex items-center justify-center font-bold text-lg">
                      %
                    </div>
                  </div>

                  {/* Pending Reports */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Antrean Validasi</span>
                      <h3 className="font-extrabold text-slate-800 text-2xl mt-1 flex items-center gap-2">
                        {stats.total_pending}
                        {stats.total_pending > 0 && (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 border border-red-200 animate-pulse">Butuh Aksi</span>
                        )}
                      </h3>
                      <span className="text-[10px] font-medium text-slate-500 mt-0.5 block">Laporan surveyor pending</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg">
                      Q
                    </div>
                  </div>
                </div>

                {/* WebGIS Map Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">Peta Pemantauan Spasial (WebGIS)</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Warna poligon berubah setelah auditor memvalidasi klaim progres lapangan.</p>
                    </div>
                    {/* Legend */}
                    <div className="flex gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-accentGreen/20 border border-accentGreen"></span> Hijau: Selesai (&gt;=100%)</span>
                      <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-accentGold/20 border border-accentGold"></span> Kuning: Berjalan (&gt;0%)</span>
                      <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-accentRed/20 border border-accentRed"></span> Merah: Belum Mulai (0%)</span>
                    </div>
                  </div>

                  <MapComponent lahanData={lahanMap} height="480px" />
                </div>

                {/* Analytical Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Bar Chart comparing Target vs Realisasi */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-2">
                    <h3 className="font-bold text-slate-800 text-sm mb-4">Grafik Target RKAB vs Realisasi Terverifikasi</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                          <Bar dataKey="Target" fill="#1e40af" name="Target RKAB (Ha)" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Realisasi" fill="#d97706" name="Realisasi Fisik (Ha)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Pie Chart of stage-wise distribution */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h3 className="font-bold text-slate-800 text-sm mb-4">Distribusi Realisasi Berdasarkan Tahap</h3>
                    
                    {stageData.length === 0 ? (
                      <div className="h-64 flex items-center justify-center text-slate-400 text-xs">Belum ada realisasi fisik terverifikasi.</div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="h-56 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={stageData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {stageData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ fontSize: '12px' }} formatter={(val) => [`${Number(val).toFixed(2)} Ha`, 'Luas']} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        
                        {/* Custom Legend */}
                        <div className="space-y-1.5 text-xs w-full px-4 mt-2">
                          {stageData.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="flex items-center gap-2 text-slate-600 truncate">
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                                <span className="truncate">{item.name}</span>
                              </span>
                              <span className="font-bold text-slate-800 shrink-0">{item.value.toFixed(2)} Ha</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

            {/* TAB 2: VALIDATION MEJA KERJA */}
            {activeTab === 'validation' && (
              <div className="space-y-6 print:hidden">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-bold text-slate-800 text-lg">Meja Kerja Validasi Laporan</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Tinjau laporan realisasi fisik surveyor dan berikan keputusan persetujuan.</p>
                  </div>
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 border border-amber-200 rounded-lg">
                    {pendingReports.length} Laporan Menunggu Verifikasi
                  </span>
                </div>

                {pendingReports.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-sm">
                    <CheckSquare className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                    <span className="font-bold text-slate-700 block mb-1">Seluruh Laporan Terverifikasi!</span>
                    Saat ini antrean meja validasi Anda dalam keadaan kosong.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingReports.map((rep) => {
                      const isProcessingThis = validatingId === rep.id;
                      return (
                        <div key={rep.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
                          
                          {/* Image evidence + Geotag display */}
                          <div className="md:w-80 p-5 bg-slate-50 flex flex-col justify-between shrink-0">
                            <div className="space-y-3">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Foto Bukti Fisik</span>
                              <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-950 h-44">
                                <img
                                  src={`${axios.defaults.baseURL.replace(/\/index\.php\/api$/, '')}/${rep.foto_url}`}
                                  alt="Bukti Foto Lapangan"
                                  className="w-full h-full object-cover hover:scale-105 transition duration-300 cursor-zoom-in"
                                  onClick={() => window.open(`${axios.defaults.baseURL.replace(/\/index\.php\/api$/, '')}/${rep.foto_url}`, '_blank')}
                                />
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 text-xs">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Verifikasi Geotag</span>
                              
                              <div className="flex justify-between">
                                <span className="text-slate-500">Garis Lintang:</span>
                                <span className="font-mono font-semibold text-slate-800">{Number(rep.latitude).toFixed(6)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Garis Bujur:</span>
                                <span className="font-mono font-semibold text-slate-800">{Number(rep.longitude).toFixed(6)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Metode Validasi:</span>
                                <span className={`font-semibold ${rep.catatan_auditor?.includes('EXIF Geotag') ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {rep.catatan_auditor?.includes('EXIF Geotag') ? 'EXIF Asli (Sistem)' : 'Device GPS Fallback'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 text-right mt-1">
                                GPS Waktu: {new Date(rep.geotag_timestamp).toLocaleString('id-ID')}
                              </div>
                            </div>
                          </div>

                          {/* Details & Action Desk */}
                          <div className="flex-1 p-6 flex flex-col justify-between">
                            <div className="space-y-4">
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <h3 className="font-extrabold text-slate-800 text-lg leading-tight">{rep.nama_lahan}</h3>
                                  <p className="text-xs text-slate-400 mt-1">Dikirim oleh Surveyor: <strong className="text-slate-700 font-semibold">{rep.surveyor_name}</strong> pada {new Date(rep.created_at).toLocaleString('id-ID')}</p>
                                </div>
                                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 uppercase tracking-wider">
                                  {rep.tahapan}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4">
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Target RKAB Blok</span>
                                  <strong className="text-slate-800 text-base">{Number(rep.target_lahan).toFixed(2)} Ha</strong>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Klaim Realisasi</span>
                                  <strong className="text-accentGold text-base">{Number(rep.luas_realisasi).toFixed(2)} Ha</strong>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Persentase Target</span>
                                  <strong className="text-slate-700 text-base">
                                    {rep.target_lahan > 0 ? ((rep.luas_realisasi / rep.target_lahan) * 100).toFixed(1) : 0}%
                                  </strong>
                                </div>
                              </div>
                            </div>

                            {/* Approval Form Inline expansion */}
                            {isProcessingThis ? (
                              <form onSubmit={handleValidationSubmit} className="mt-6 pt-6 border-t border-slate-100 space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                                <div>
                                  <label className="block text-slate-700 text-xs font-bold mb-1.5">
                                    Catatan Auditor / Alasan {validationAction === 'Approved' ? 'Persetujuan' : 'Penolakan'}
                                  </label>
                                  <textarea
                                    rows="2"
                                    value={validationComment}
                                    onChange={(e) => setValidationComment(e.target.value)}
                                    placeholder={validationAction === 'Approved' ? 'contoh: Data fisik valid sesuai koordinat geotag...' : 'contoh: Foto buram / lokasi tidak cocok...'}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-accentGold rounded-lg text-xs outline-none transition"
                                    required={validationAction === 'Rejected'} // Require comments for rejection
                                  ></textarea>
                                </div>

                                {validationError && (
                                  <div className="text-xs text-red-600 font-semibold">{validationError}</div>
                                )}

                                <div className="flex gap-3 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => setValidatingId(null)}
                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="submit"
                                    className={`px-4 py-2 text-white font-bold text-xs rounded-lg shadow-sm transition ${
                                      validationAction === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                  >
                                    Konfirmasi {validationAction === 'Approved' ? 'Setujui' : 'Tolak'}
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                                <button
                                  onClick={() => startValidation(rep.id, 'Rejected')}
                                  className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs rounded-lg flex items-center gap-1.5 transition"
                                >
                                  <X className="w-4 h-4" /> Tolak Klaim
                                </button>
                                <button
                                  onClick={() => startValidation(rep.id, 'Approved')}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition"
                                >
                                  <Check className="w-4 h-4" /> Setujui Klaim
                                </button>
                              </div>
                            )}

                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: AUDIT TRAIL LOGS */}
            {activeTab === 'audit' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-slate-800 text-base">Rekam Jejak Log Aktivitas (Audit Trail)</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Transparansi penuh atas riwayat pelaporan dan validasi yang terjadi di dalam sistem.</p>
                  </div>
                  <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1.5 border border-slate-200 rounded-lg">
                    Menampilkan 50 log terakhir
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="px-6 py-3">Pengguna</th>
                        <th className="px-6 py-3">Aksi</th>
                        <th className="px-6 py-3">Detail Perubahan</th>
                        <th className="px-6 py-3 text-right">Waktu Kejadian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center p-8 text-slate-400 text-xs">Belum ada aktivitas tercatat.</td>
                        </tr>
                      ) : (
                        auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition">
                            <td className="px-6 py-4 font-semibold text-slate-900">{log.username}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                log.action.includes('Approved') || log.action.includes('Create') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                log.action.includes('Rejected') || log.action.includes('Delete') ? 'bg-red-50 text-red-700 border border-red-200' :
                                'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-600 leading-normal max-w-sm break-words">{log.details}</td>
                            <td className="px-6 py-4 text-xs text-slate-400 text-right font-medium">
                              {new Date(log.created_at).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: EXECUTIVE REPORT GENERATOR (PRINT READY) */}
            {activeTab === 'export' && (
              <div className="space-y-6">
                
                {/* Print Control Bar - Hidden on print */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between print:hidden">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Generator Laporan Evaluasi Progres</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Format dokumen print-ready untuk diunduh sebagai PDF atau dicetak langsung.</p>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-accentGold hover:bg-opacity-95 text-secondaryNavy-dark font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Printer className="w-4 h-4" /> Cetak Laporan (PDF)
                  </button>
                </div>

                {/* The Document Preview */}
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:mx-0">
                  
                  {/* Document Header */}
                  <div className="text-center border-b-2 border-slate-800 pb-6 mb-8 relative">
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wide">Laporan Evaluasi Kegiatan Reklamasi Pertambangan</h1>
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">Sistem Informasi Pemantauan Progres (WebGIS)</h2>
                    <div className="text-xs text-slate-400 mt-4 flex justify-between px-4">
                      <span>Metode Pelaporan: Terverifikasi Digital</span>
                      <span>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Summary section */}
                  <div className="mb-8 space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-1.5 uppercase tracking-wide">1. Ringkasan Progres Kegiatan</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="border border-slate-200 rounded-lg p-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Konsesi</span>
                        <strong className="text-slate-800 text-xl font-bold">{stats.total_lahan} Lahan</strong>
                      </div>
                      <div className="border border-slate-200 rounded-lg p-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Target RKAB</span>
                        <strong className="text-slate-800 text-xl font-bold">{Number(stats.total_target).toFixed(2)} Ha</strong>
                      </div>
                      <div className="border border-slate-200 rounded-lg p-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Realisasi</span>
                        <strong className="text-slate-800 text-xl font-bold">{Number(stats.total_realisasi).toFixed(2)} Ha</strong>
                      </div>
                      <div className="border border-slate-200 rounded-lg p-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Progres Rata-rata</span>
                        <strong className="text-accentGold text-xl font-bold">{Number(stats.overall_percentage).toFixed(2)}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Table details */}
                  <div className="mb-12 space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-1.5 uppercase tracking-wide">2. Rincian Progres Per Blok Lahan</h3>
                    
                    <table className="w-full text-left text-sm text-slate-600 border border-slate-200 rounded-lg overflow-hidden">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 border-r border-slate-200">Nama Blok</th>
                          <th className="px-4 py-3 border-r border-slate-200 text-right">Target RKAB (Ha)</th>
                          <th className="px-4 py-3 border-r border-slate-200 text-right">Realisasi (Ha)</th>
                          <th className="px-4 py-3 text-right">Persentase (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {lahanMap.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 border-r border-slate-200 font-semibold text-slate-800">{l.nama_blok}</td>
                            <td className="px-4 py-3 border-r border-slate-200 text-right">{Number(l.target_luas).toFixed(2)} Ha</td>
                            <td className="px-4 py-3 border-r border-slate-200 text-right font-medium">{Number(l.total_realisasi).toFixed(2)} Ha</td>
                            <td className="px-4 py-3 text-right font-bold">
                              <span className={
                                l.progress_percentage >= 100 ? 'text-emerald-600' :
                                l.progress_percentage > 0 ? 'text-amber-600' : 'text-red-500'
                              }>
                                {Number(l.progress_percentage).toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Sign-off section */}
                  <div className="grid grid-cols-2 gap-8 text-center pt-8 border-t border-slate-200">
                    <div className="space-y-16">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Dibuat Oleh:</div>
                      <div className="space-y-1">
                        <strong className="text-slate-800 text-sm underline block">{user?.username}</strong>
                        <span className="text-[10px] text-slate-400 font-medium uppercase">Auditor / Manajemen</span>
                      </div>
                    </div>
                    <div className="space-y-16">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Disetujui Oleh instansi terkait:</div>
                      <div className="space-y-1">
                        <strong className="text-slate-800 text-sm block">_____________________</strong>
                        <span className="text-[10px] text-slate-400 font-medium uppercase">Kepala Teknik Tambang</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </main>
        )}
      </div>
    </div>
  );
}
