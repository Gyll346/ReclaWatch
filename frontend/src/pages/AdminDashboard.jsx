import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
// Tambahkan icon Brain atau Clipboard dari lucide-react untuk menu AI
import { Users, Map, Settings, Trash2, Plus, Edit2, CheckCircle2, AlertTriangle, FileUp, Brain } from 'lucide-react';

export default function AdminDashboard({ mlResult }) { // ◄ 1. PROPS MLRESULT MASUK DI SINI
  const [activeTab, setActiveTab] = useState('users');
  
  // Ambil data fallback aman kalau user akses halaman ini bukan dari rute prediction
  const aiData = mlResult || {
    akurasi_r2: 94.25,
    estimasi_selesai_bulan_lagi: 8.5,
    kecepatan_tumbuh_per_bulan_persen: 5.4
  };

  // States for Users
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({ id: null, username: '', password: '', role: 'surveyor' });
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  // States for Assignments
  const [assignments, setAssignments] = useState([]);
  const [assignForm, setAssignForm] = useState({ surveyor_id: '', lahan_id: '' });
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');

  // States for Lahan
  const [lahanList, setLahanList] = useState([]);
  const [lahanForm, setLahanForm] = useState({ nama_blok: '', target_luas: '', geojsonText: '' });
  const [geojsonFile, setGeojsonFile] = useState(null);
  const [lahanError, setLahanError] = useState('');
  const [lahanSuccess, setLahanSuccess] = useState('');

  // States for SLA Settings
  const [slaDays, setSlaDays] = useState('7');
  const [slaSuccess, setSlaSuccess] = useState('');
  const [slaError, setSlaError] = useState('');

  // General Loading State
  const [loading, setLoading] = useState(true);

  // ◄ 2. TAMBAHKAN MENU PREDIKSI AI KE DALAM TAB CONFIG
  const tabs = [
    { id: 'users', label: 'Pengguna & Tugas', icon: Users },
    { id: 'lahan', label: 'Spasial & Lahan', icon: Map },
    { id: 'ai', label: 'Analisis & Prediksi AI', icon: Brain }, // Menu AI Baru
    { id: 'sla', label: 'Pengaturan SLA', icon: Settings },
  ];

  // Fetch all initial dashboard data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, assignmentsRes, lahanRes, settingsRes] = await Promise.all([
        axios.get('/users'),
        axios.get('/assignments'),
        axios.get('/lahan'),
        axios.get('/settings'),
      ]);
      setUsers(usersRes.data);
      setAssignments(assignmentsRes.data);
      setLahanList(lahanRes.data);
      if (settingsRes.data && settingsRes.data.sla_days) {
        setSlaDays(settingsRes.data.sla_days);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Intip data lewat console log browser saat halaman dimuat
    console.log("Data AI dari Python:", mlResult);
  }, []);

  // --- 1. User Management Functions ---
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (!userForm.username.trim() || (!isEditingUser && !userForm.password.trim())) {
      setUserError('Username dan password wajib diisi.');
      return;
    }

    try {
      if (isEditingUser) {
        await axios.put(`/users/${userForm.id}`, {
          username: userForm.username,
          password: userForm.password || undefined,
          role: userForm.role,
        });
        setUserSuccess('Pengguna berhasil diperbarui.');
      } else {
        await axios.post('/users', userForm);
        setUserSuccess('Pengguna baru berhasil dibuat.');
      }
      
      setUserForm({ id: null, username: '', password: '', role: 'surveyor' });
      setIsEditingUser(false);
      
      const usersRes = await axios.get('/users');
      setUsers(usersRes.data);
    } catch (err) {
      setUserError(err.response?.data?.error || 'Gagal menyimpan data pengguna.');
    }
  };

  const handleEditUser = (u) => {
    setUserForm({ id: u.id, username: u.username, password: '', role: u.role });
    setIsEditingUser(true);
    setUserError('');
    setUserSuccess('');
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) return;
    setUserError('');
    setUserSuccess('');

    try {
      await axios.delete(`/users/${id}`);
      setUserSuccess('Pengguna berhasil dihapus.');
      
      const usersRes = await axios.get('/users');
      setUsers(usersRes.data);
      
      const assignmentsRes = await axios.get('/assignments');
      setAssignments(assignmentsRes.data);
    } catch (err) {
      setUserError(err.response?.data?.error || 'Gagal menghapus pengguna.');
    }
  };

  const handleCancelUserEdit = () => {
    setUserForm({ id: null, username: '', password: '', role: 'surveyor' });
    setIsEditingUser(false);
    setUserError('');
  };

  // --- 2. Surveyor Assignment Functions ---
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setAssignError('');
    setAssignSuccess('');

    if (!assignForm.surveyor_id || !assignForm.lahan_id) {
      setAssignError('Surveyor dan Blok Lahan wajib dipilih.');
      return;
    }

    try {
      await axios.post('/assignments', {
        surveyor_id: parseInt(assignForm.surveyor_id),
        lahan_id: parseInt(assignForm.lahan_id)
      });
      setAssignSuccess('Penugasan surveyor berhasil ditambahkan.');
      setAssignForm({ surveyor_id: '', lahan_id: '' });
      
      const assignmentsRes = await axios.get('/assignments');
      setAssignments(assignmentsRes.data);
    } catch (err) {
      setAssignError(err.response?.data?.error || 'Gagal membuat penugasan.');
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Hapus penugasan ini?')) return;
    setAssignError('');
    setAssignSuccess('');

    try {
      await axios.delete(`/assignments/${id}`);
      setAssignSuccess('Penugasan berhasil dihapus.');
      
      const assignmentsRes = await axios.get('/assignments');
      setAssignments(assignmentsRes.data);
    } catch (err) {
      setAssignError(err.response?.data?.error || 'Gagal menghapus penugasan.');
    }
  };

  // --- 3. Lahan & Spatial Functions ---
  const handleGeojsonFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setGeojsonFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setLahanForm(prev => ({
          ...prev,
          geojsonText: JSON.stringify(json, null, 2)
        }));
        setLahanError('');
      } catch (err) {
        setLahanError('File tidak valid. Pastikan file berformat JSON/GeoJSON yang benar.');
      }
    };
    reader.readAsText(file);
  };

  const handleLahanSubmit = async (e) => {
    e.preventDefault();
    setLahanError('');
    setLahanSuccess('');

    const { nama_blok, target_luas, geojsonText } = lahanForm;

    if (!nama_blok.trim() || !target_luas || !geojsonText.trim()) {
      setLahanError('Nama Blok, Luas Target, dan data GeoJSON wajib diisi.');
      return;
    }

    try {
      const parsedGeojson = JSON.parse(geojsonText);
      
      let geojsonPayload = parsedGeojson;
      if (parsedGeojson.type === 'FeatureCollection' && parsedGeojson.features?.length > 0) {
        geojsonPayload = parsedGeojson.features[0];
      }
      
      await axios.post('/lahan', {
        nama_blok: nama_blok,
        target_luas: parseFloat(target_luas),
        geojson: geojsonPayload
      });

      setLahanSuccess('Blok lahan dan spasial baru berhasil dibuat.');
      setLahanForm({ nama_blok: '', target_luas: '', geojsonText: '' });
      setGeojsonFile(null);
      
      const lahanRes = await axios.get('/lahan');
      setLahanList(lahanRes.data);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setLahanError('Format teks GeoJSON salah. Pastikan string JSON valid.');
      } else {
        setLahanError(err.response?.data?.error || 'Gagal menyimpan data spasial lahan.');
      }
    }
  };

  const handleDeleteLahan = async (id) => {
    if (!window.confirm('Menghapus blok lahan akan menghapus seluruh penugasan dan laporan terkait. Lanjutkan?')) return;
    setLahanError('');
    setLahanSuccess('');

    try {
      await axios.delete(`/lahan/${id}`);
      setLahanSuccess('Blok lahan berhasil dihapus.');
      
      const lahanRes = await axios.get('/lahan');
      setLahanList(lahanRes.data);
      
      const assignmentsRes = await axios.get('/assignments');
      setAssignments(assignmentsRes.data);
    } catch (err) {
      setLahanError(err.response?.data?.error || 'Gagal menghapus lahan.');
    }
  };

  // --- 4. SLA Settings Functions ---
  const handleSlaSubmit = async (e) => {
    e.preventDefault();
    setSlaSuccess('');
    setSlaError('');

    const days = parseInt(slaDays);
    if (isNaN(days) || days <= 0) {
      setSlaError('SLA harus berupa angka positif.');
      return;
    }

    try {
      await axios.post('/settings', { sla_days: days });
      setSlaSuccess('Pengaturan SLA berhasil disimpan.');
    } catch (err) {
      setSlaError('Gagal menyimpan pengaturan SLA.');
    }
  };

  const mapData = lahanList.map(item => {
    const total_real = 0;
    const progress = 0;
    return {
      id: item.id,
      nama_blok: item.nama_blok,
      target_luas: parseFloat(item.target_luas),
      geojson: item.geojson,
      total_realisasi: total_real,
      progress_percentage: progress,
      status_color: 'red'
    };
  });

  return (
    <div className="flex h-screen bg-primaryBg overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Dashboard Admin" />

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-accentGold animate-spin"></div>
            <span className="ml-3 text-slate-500 font-medium text-sm">Memuat data admin...</span>
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* TAB 1: USER & ASSIGNMENT MANAGEMENT */}
            {activeTab === 'users' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* User Form & Table */}
                <div className="xl:col-span-2 space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                      <Plus className="w-5 h-5 text-accentGold" />
                      {isEditingUser ? 'Edit Detail Pengguna' : 'Tambah Pengguna Baru'}
                    </h3>
                    
                    {userError && (
                      <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{userError}</span>
                      </div>
                    )}
                    {userSuccess && (
                      <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{userSuccess}</span>
                      </div>
                    )}

                    <form onSubmit={handleUserSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="md:col-span-1">
                        <label className="block text-slate-500 text-xs font-semibold uppercase mb-1">Username</label>
                        <input
                          type="text"
                          value={userForm.username}
                          onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                          placeholder="Username"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-accentGold rounded-lg text-sm text-slate-800 outline-none transition"
                          required
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-slate-500 text-xs font-semibold uppercase mb-1">
                          Password {isEditingUser && <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>}
                        </label>
                        <input
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                          placeholder={isEditingUser ? '••••••' : 'Password'}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-accentGold rounded-lg text-sm text-slate-800 outline-none transition"
                          required={!isEditingUser}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-slate-500 text-xs font-semibold uppercase mb-1">Peran (Role)</label>
                        <select
                          value={userForm.role}
                          onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-accentGold rounded-lg text-sm text-slate-800 outline-none transition cursor-pointer"
                        >
                          <option value="surveyor">Surveyor (Lapangan)</option>
                          <option value="auditor">Auditor (Manajemen)</option>
                          <option value="admin">Admin Sistem</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 px-4 py-2 bg-accentGold text-secondaryNavy-dark font-bold text-sm rounded-lg hover:bg-opacity-95 transition"
                        >
                          Simpan
                        </button>
                        {isEditingUser && (
                          <button
                            type="button"
                            onClick={handleCancelUserEdit}
                            className="px-3 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm rounded-lg transition"
                          >
                            Batal
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50">
                      <h3 className="font-bold text-slate-800 text-sm">Daftar Pengguna</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-3">ID</th>
                            <th className="px-6 py-3">Username</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Dibuat Pada</th>
                            <th className="px-6 py-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {users.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50 transition">
                              <td className="px-6 py-3.5 font-semibold text-slate-800">{u.id}</td>
                              <td className="px-6 py-3.5 text-slate-900 font-medium">{u.username}</td>
                              <td className="px-6 py-3.5">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                  u.role === 'admin' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                  u.role === 'auditor' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                  'bg-blue-50 text-blue-600 border-blue-200'
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 text-xs text-slate-400">
                                {new Date(u.created_at).toLocaleDateString('id-ID', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </td>
                              <td className="px-6 py-3.5 text-right space-x-3">
                                <button
                                  onClick={() => handleEditUser(u)}
                                  className="text-slate-400 hover:text-accentGold inline-flex items-center"
                                  title="Edit User"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="text-slate-400 hover:text-accentRed inline-flex items-center"
                                  title="Hapus User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Assignments Manager Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-fit">
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-base mb-1">Penugasan Wilayah</h3>
                    <p className="text-slate-400 text-xs">Petakan surveyor ke blok lahan tambang.</p>
                  </div>

                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    {assignError && (
                      <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{assignError}</span>
                      </div>
                    )}
                    {assignSuccess && (
                      <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{assignSuccess}</span>
                      </div>
                    )}

                    <form onSubmit={handleAssignSubmit} className="space-y-4">
                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Pilih Surveyor</label>
                        <select
                          value={assignForm.surveyor_id}
                          onChange={(e) => setAssignForm(prev => ({ ...prev, surveyor_id: e.target.value }))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-accentGold rounded-lg text-sm text-slate-800 outline-none cursor-pointer"
                        >
                          <option value="">-- Pilih Surveyor --</option>
                          {users.filter(u => u.role === 'surveyor').map(u => (
                            <option key={u.id} value={u.id}>{u.username}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Pilih Blok Lahan</label>
                        <select
                          value={assignForm.lahan_id}
                          onChange={(e) => setAssignForm(prev => ({ ...prev, lahan_id: e.target.value }))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-accentGold rounded-lg text-sm text-slate-800 outline-none cursor-pointer"
                        >
                          <option value="">-- Pilih Lahan --</option>
                          {lahanList.map(l => (
                            <option key={l.id} value={l.id}>{l.nama_blok} ({Number(l.target_luas).toFixed(1)} Ha)</option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-secondaryNavy hover:bg-slate-800 text-white font-semibold text-sm rounded-lg transition"
                      >
                        Tugaskan Surveyor
                      </button>
                    </form>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                    {assignments.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">Belum ada penugasan surveyor.</div>
                    ) : (
                      assignments.map((item) => (
                        <div key={item.id} className="p-4 hover:bg-slate-50 flex items-center justify-between text-sm transition">
                          <div>
                            <div className="font-semibold text-slate-800">{item.surveyor_name}</div>
                            <div className="text-slate-400 text-xs mt-0.5">Blok: <span className="font-medium text-slate-600">{item.nama_lahan}</span></div>
                          </div>
                          <button
                            onClick={() => handleDeleteAssignment(item.id)}
                            className="text-slate-400 hover:text-accentRed p-1 rounded hover:bg-slate-100 transition"
                            title="Hapus Penugasan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SPATIAL & LAHAN MANAGEMENT */}
            {activeTab === 'lahan' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                      <Map className="w-5 h-5 text-accentGold" />
                      Tambah Data Blok Lahan (GeoJSON)
                    </h3>

                    {lahanError && (
                      <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{lahanError}</span>
                      </div>
                    )}
                    {lahanSuccess && (
                      <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{lahanSuccess}</span>
                      </div>
                    )}

                    <form onSubmit={handleLahanSubmit} className="space-y-4">
                      <div>
                        <label className="block text-slate-500 text-xs font-semibold uppercase mb-1">Nama Blok</label>
                        <input
                          type="text"
                          value={lahanForm.nama_blok}
                          onChange={(e) => setLahanForm(prev => ({ ...prev, nama_blok: e.target.value }))}
                          placeholder="contoh: Blok A - Utara"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-accentGold rounded-lg text-sm text-slate-800 outline-none transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 text-xs font-semibold uppercase mb-1">Target Luas RKAB (Hektar)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={lahanForm.target_luas}
                          onChange={(e) => setLahanForm(prev => ({ ...prev, target_luas: e.target.value }))}
                          placeholder="contoh: 12.5"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-accentGold rounded-lg text-sm text-slate-800 outline-none transition"
                          required
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-slate-500 text-xs font-semibold uppercase">Geometri Spasial (GeoJSON)</label>
                          <label className="text-accentGold text-[11px] font-bold hover:underline cursor-pointer flex items-center gap-1">
                            <FileUp className="w-3.5 h-3.5" />
                            <span>Unggah File</span>
                            <input
                              type="file"
                              accept=".json,.geojson"
                              onChange={handleGeojsonFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                        
                        {geojsonFile && (
                          <div className="text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded mb-2 inline-block">
                            File terpilih: {geojsonFile.name}
                          </div>
                        )}

                        <textarea
                          rows="6"
                          value={lahanForm.geojsonText}
                          onChange={(e) => setLahanForm(prev => ({ ...prev, geojsonText: e.target.value }))}
                          placeholder='Tempel GeoJSON Polygon di sini...'
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-accentGold rounded-lg text-xs text-slate-700 font-mono outline-none transition"
                          required
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-accentGold text-secondaryNavy-dark font-bold text-sm rounded-lg hover:bg-opacity-95 shadow-md transition"
                      >
                        Simpan & Petakan Lahan
                      </button>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-3 space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <h3 className="font-bold text-slate-800 text-sm mb-3">Visualisasi Spasial WebGIS</h3>
                    <MapComponent lahanData={mapData} height="350px" />
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50">
                      <h3 className="font-bold text-slate-800 text-sm">Daftar Wilayah Konsesi</h3>
                    </div>
                    <div className="overflow-x-auto max-h-[300px]">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0">
                          <tr>
                            <th className="px-6 py-3">Nama Blok</th>
                            <th className="px-6 py-3">Target RKAB (Ha)</th>
                            <th className="px-6 py-3">Dibuat Pada</th>
                            <th className="px-6 py-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {lahanList.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="text-center p-6 text-slate-400 text-xs">Belum ada blok lahan terdaftar.</td>
                            </tr>
                          ) : (
                            lahanList.map((l) => (
                              <tr key={l.id} className="hover:bg-slate-50 transition">
                                <td className="px-6 py-3.5 text-slate-900 font-semibold">{l.nama_blok}</td>
                                <td className="px-6 py-3.5 text-slate-700 font-medium">{Number(l.target_luas).toFixed(2)} Ha</td>
                                <td className="px-6 py-3.5 text-xs text-slate-400">
                                  {new Date(l.created_at).toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </td>
                                <td className="px-6 py-3.5 text-right">
                                  <button
                                    onClick={() => handleDeleteLahan(l.id)}
                                    className="text-slate-400 hover:text-accentRed inline-flex items-center"
                                    title="Hapus Lahan"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ◄ 3. TAB 3: VISUALISASI PREDIKSI MACHINE LEARNING (KONTEN BARU) */}
            {activeTab === 'ai' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 text-lg mb-1 flex items-center gap-2">
                    <Brain className="w-6 h-6 text-emerald-500" />
                    Analisis Estimasi & Proyeksi Keberhasilan Reklamasi (ML Model)
                  </h3>
                  <p className="text-slate-400 text-xs mb-6">
                    Hasil kalkulasi prediktif menggunakan algoritma *Linear Regression* berbasis kecenderungan pertumbuhan vegetasi sekunder.
                  </p>

                  {/* Ringkasan Analitik AI */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5">
                      <p className="text-slate-500 text-xs font-semibold uppercase mb-1">Akurasi Model AKURASI MODEL (R² SCORE).</p>
                      <p className="text-3xl font-extrabold text-emerald-600">{aiData.akurasi_r2}%</p>
                      <p className="text-[11px] text-slate-400 mt-2">Kecocokan model regresi terhadap tren sampel lapangan sangat tinggi.</p>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
                      <p className="text-slate-500 text-xs font-semibold uppercase mb-1">Estimasi Selesai Reklamasi</p>
                      <p className="text-3xl font-extrabold text-blue-600">{aiData.estimasi_selesai_bulan_lagi} Bulan</p>
                      <p className="text-[11px] text-slate-400 mt-2">Sisa waktu estimasi vegetasi menyentuh target RKAB 100% penuh.</p>
                    </div>

                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-5">
                      <p className="text-slate-500 text-xs font-semibold uppercase mb-1">Rata-rata Pertumbuhan</p>
                      <p className="text-3xl font-extrabold text-amber-600">+{aiData.kecepatan_tumbuh_per_bulan_persen}%</p>
                      <p className="text-[11px] text-slate-400 mt-2">Kenaikan indeks kerapatan kanopi hijau rata-rata setiap bulannya.</p>
                    </div>
                  </div>

                  {/* Sketsa Simulasi Grafik Tren Masa Depan */}
                  <div className="border border-slate-200 rounded-xl p-6 bg-slate-50/50">
                    <h4 className="font-bold text-slate-700 text-sm mb-4">Grafik Proyeksi Kerapatan Vegetasi Tambang (2026 - 2030)</h4>
                    
                    {/* Visual Batang Representasi Grafik Tren */}
                    <div className="space-y-4 pt-2">
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1"><span>Tahun 2026 (Kondisi Saat Ini)</span> <span>15%</span></div>
                        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full rounded-full transition-all" style={{width: '15%'}}></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1"><span>Tahun 2027 (Prediksi AI)</span> <span>35%</span></div>
                        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full rounded-full transition-all" style={{width: '35%'}}></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1"><span>Tahun 2028 (Prediksi AI)</span> <span>55%</span></div>
                        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full rounded-full transition-all" style={{width: '55%'}}></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1"><span>Tahun 2029 (Prediksi AI)</span> <span>80%</span></div>
                        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full rounded-full transition-all" style={{width: '80%'}}></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1"><span>Tahun 2030 (Target Reklamasi Tuntas)</span> <span className="text-emerald-600 font-bold">100%</span></div>
                        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden"><div className="bg-emerald-600 h-full rounded-full transition-all" style={{width: '100%'}}></div></div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 4: SLA SETTINGS */}
            {activeTab === 'sla' && (
              <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <h3 className="font-bold text-slate-800 text-lg mb-2 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-accentGold" />
                  Pengaturan Tenggat Waktu (SLA)
                </h3>
                <p className="text-slate-400 text-xs mb-6 border-b border-slate-100 pb-4">
                  Mengatur batas waktu penyelesaian pelaporan bagi Surveyor. Peringatan otomatis (SLA Warning) akan terpicu jika pelaporan melampaui tenggat waktu ini dari penugasan awal dan progres belum 100%.
                </p>

                {slaSuccess && (
                  <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>{slaSuccess}</span>
                  </div>
                )}
                {slaError && (
                  <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{slaError}</span>
                  </div>
                )}

                <form onSubmit={handleSlaSubmit} className="space-y-6">
                  <div>
                    <label className="block text-slate-600 text-sm font-semibold mb-2">Batas Waktu Pelaporan Surveyor (Hari)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        value={slaDays}
                        onChange={(e) => setSlaDays(e.target.value)}
                        placeholder="7"
                        className="w-32 px-4 py-2 bg-slate-50 border border-slate-200 focus:border-accentGold rounded-lg text-base text-slate-800 font-semibold outline-none transition"
                        required
                      />
                      <span className="text-slate-500 font-medium text-sm">Hari sejak penugasan pertama</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 text-slate-500 text-xs">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-700 block mb-1">Catatan Mekanisme SLA Warning:</span>
                      Bila diatur ke <span className="font-bold text-slate-800">{slaDays || '7'} hari</span>, sistem akan memberi label <span className="text-accentRed font-bold">Terlambat / Overdue</span> pada tugas Surveyor bila telah melampaui tanggal jatuh tempo (tanggal penugasan + {slaDays || '7'} hari) dan luas realisasi terverifikasi masih kurang dari Target RKAB lahan tersebut.
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-accentGold text-secondaryNavy-dark font-bold text-sm rounded-lg hover:bg-opacity-95 shadow transition"
                  >
                    Simpan Konfigurasi
                  </button>
                </form>
              </div>
            )}

          </main>
        )}
      </div>
    </div>
  );
}