import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Phone,
  MapPin,
  FileText,
  Layers,
  Check,
  X,
  AlertCircle,
  Percent,
  Save,
  Edit2,
  Tag
} from 'lucide-react';

import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function SupplierVerificationView({ preselectedSupplierName, onClearPreselected }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState(null);
  const [message, setMessage] = useState('');
  
  // CRM Detail Workspace state
  const [activeSupplier, setActiveSupplier] = useState(null);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Inline commission editing state
  const [editingCommId, setEditingCommId] = useState(null);
  const [editCommPct, setEditCommPct] = useState('');
  const [savingComm, setSavingComm] = useState(false);
  const [commMsg, setCommMsg] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Auto-expand pre-selected supplier from catalog navigation
  useEffect(() => {
    if (preselectedSupplierName && suppliers.length > 0) {
      const match = suppliers.find(s => s.supplier_name.toLowerCase() === preselectedSupplierName.toLowerCase());
      if (match) {
        setActiveSupplier(match);
      }
      onClearPreselected();
    }
  }, [preselectedSupplierName, suppliers, onClearPreselected]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin_suppliers.php');
      setSuppliers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Gagal mengambil data supplier", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Fetch products for selected supplier catalog moderation
  const fetchSupplierProducts = async (supplier) => {
    setLoadingProducts(true);
    try {
      const response = await apiClient.get('/admin_products.php');
      const all = Array.isArray(response.data) ? response.data : [];
      const filtered = all.filter(p => p.supplier_name === supplier.supplier_name);
      setSupplierProducts(filtered);
    } catch (err) {
      console.error("Gagal memuat produk supplier", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (!activeSupplier) {
      setSupplierProducts([]);
      return;
    }
    fetchSupplierProducts(activeSupplier);
  }, [activeSupplier]);

  // Leaflet map inside supplier detail view
  useEffect(() => {
    if (!activeSupplier || !mapContainerRef.current) return;

    const lat = parseFloat(activeSupplier.latitude);
    const lng = parseFloat(activeSupplier.longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current).setView([lat, lng], 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    L.marker([lat, lng]).addTo(map).bindPopup(activeSupplier.supplier_name).openPopup();

    const radius = (activeSupplier.coverage_radius_km || 15) * 1000;
    L.circle([lat, lng], {
      color: '#10B981',
      fillColor: '#10B981',
      fillOpacity: 0.15,
      radius: radius
    }).addTo(map);

    setTimeout(() => { map.invalidateSize(); }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeSupplier]);

  const handleToggleVerify = async (supplier, currentStatus) => {
    setActionId(supplier.id);
    setMessage('');
    const newStatus = parseInt(currentStatus) === 1 ? 0 : 1;
    try {
      await apiClient.put('/admin_suppliers.php', { id: supplier.id, is_verified: newStatus });
      setMessage('Status verifikasi supplier berhasil diperbarui!');
      const updated = { ...supplier, is_verified: newStatus };
      setActiveSupplier(updated);
      fetchSuppliers();
    } catch (err) {
      setMessage('Gagal memperbarui status verifikasi.');
    } finally {
      setActionId(null);
    }
  };

  const handleToggleProduct = async (prodId, currentStatus) => {
    const newStatus = parseInt(currentStatus) === 1 ? 0 : 1;
    try {
      await apiClient.put('/admin_products.php', { id: prodId, is_active: newStatus });
      setSupplierProducts(prev => prev.map(p => p.id === prodId ? { ...p, is_active: newStatus } : p));
    } catch (err) {
      alert("Gagal memperbarui status produk.");
    }
  };

  // Save custom commission per item
  const handleSaveCustomCommission = async (prodId) => {
    setSavingComm(true);
    setCommMsg(null);
    try {
      const pct = editCommPct === '' ? null : parseFloat(editCommPct);
      await apiClient.post('/admin_products.php', {
        action: 'set_custom_commission',
        id: prodId,
        custom_commission_pct: pct
      });
      setCommMsg({
        type: 'success',
        text: pct === null
          ? 'Komisi kustom dihapus. Kembali ke tarif global.'
          : `Komisi kustom ${pct}% disimpan untuk item ini.`
      });
      setEditingCommId(null);
      // Refresh product list to reflect changes
      fetchSupplierProducts(activeSupplier);
    } catch (err) {
      setCommMsg({ type: 'error', text: 'Gagal menyimpan komisi kustom item.' });
    } finally {
      setSavingComm(false);
      setTimeout(() => setCommMsg(null), 3500);
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_person.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  if (activeSupplier) {
    return (
      <div className="space-y-6">
        {/* Back header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-4">
          <button
            onClick={() => setActiveSupplier(null)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Daftar Supplier</span>
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleToggleVerify(activeSupplier, activeSupplier.is_verified)}
              disabled={actionId === activeSupplier.id}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-sm ${
                parseInt(activeSupplier.is_verified) === 1
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {actionId === activeSupplier.id ? (
                <Loader2 className="animate-spin" size={14} />
              ) : parseInt(activeSupplier.is_verified) === 1 ? (
                'Tangguhkan Verifikasi'
              ) : (
                'Setujui & Verifikasi Akun'
              )}
            </button>
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-xl text-sm font-semibold border bg-green-50 border-green-200 text-green-700">
            {message}
          </div>
        )}

        {/* Header Summary */}
        <div className="bg-white border rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-extrabold text-gray-800">{activeSupplier.supplier_name}</h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase">
                ID: SP-{String(activeSupplier.id).padStart(4, '0')}
              </span>
              {activeSupplier.is_verified === 1 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                  <CheckCircle2 size={12} /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <ShieldAlert size={12} /> Pending Audit
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1 font-semibold flex items-center gap-1"><MapPin size={14} /> {activeSupplier.address}</p>
          </div>

          <div className="grid grid-cols-3 gap-6 text-center border-l pl-6">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Reputasi</p>
              <p className="text-lg font-black text-gray-800 mt-1">⭐️ {parseFloat(activeSupplier.average_rating || 0).toFixed(1)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Skor SLA</p>
              <p className="text-lg font-black text-emerald-600 mt-1">{parseFloat(activeSupplier.sla_score || 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Proses Kemas</p>
              <p className="text-lg font-black text-gray-800 mt-1">🕒 {parseFloat(activeSupplier.avg_process_time_hours || 0).toFixed(1)}j</p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* 1. Legalitas Berkas */}
            <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-extrabold text-sm text-gray-800 flex items-center gap-1.5"><FileText size={18} className="text-emerald-500" /> Dokumen & Legalitas Hukum</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {/* KTP */}
                <div className="border border-gray-150 rounded-xl p-3 bg-gray-50 text-center flex flex-col justify-between items-center min-h-[110px]">
                  <div>
                    <span className="text-lg block">🪪</span>
                    <span className="text-[10px] font-bold text-gray-800 block mt-1">KTP Pemilik</span>
                  </div>
                  {activeSupplier.ktp_doc_path ? (
                    <a
                      href={`${apiClient.defaults.baseURL.replace('/app', '')}/${activeSupplier.ktp_doc_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-2 py-0.5 rounded-full font-bold mt-1"
                    >
                      Lihat Berkas
                    </a>
                  ) : (
                    <span className="text-[9px] text-red-500 font-bold italic mt-1">Belum diisi</span>
                  )}
                </div>

                {/* NIB */}
                <div className="border border-gray-150 rounded-xl p-3 bg-gray-50 text-center flex flex-col justify-between items-center min-h-[110px]">
                  <div>
                    <span className="text-lg block">📄</span>
                    <span className="text-[10px] font-bold text-gray-800 block mt-1">Nomor NIB</span>
                    <span className={`text-[9px] font-semibold block mt-0.5 ${activeSupplier.nib_number ? 'text-gray-600' : 'text-red-500 italic'}`}>
                      {activeSupplier.nib_number || 'Belum diisi'}
                    </span>
                  </div>
                  {activeSupplier.nib_doc_path && (
                    <a
                      href={`${apiClient.defaults.baseURL.replace('/app', '')}/${activeSupplier.nib_doc_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-2 py-0.5 rounded-full font-bold mt-1"
                    >
                      Lihat Berkas
                    </a>
                  )}
                </div>

                {/* Halal */}
                <div className="border border-gray-150 rounded-xl p-3 bg-gray-50 text-center flex flex-col justify-between items-center min-h-[110px]">
                  <div>
                    <span className="text-lg block">📜</span>
                    <span className="text-[10px] font-bold text-emerald-700 block mt-1">Sertifikat Halal</span>
                    <span className={`text-[9px] font-semibold block mt-0.5 ${activeSupplier.halal_cert_number ? 'text-gray-600' : 'text-red-500 italic'}`}>
                      {activeSupplier.halal_cert_number || 'Belum diisi'}
                    </span>
                  </div>
                  {activeSupplier.halal_doc_path && (
                    <a
                      href={`${apiClient.defaults.baseURL.replace('/app', '')}/${activeSupplier.halal_doc_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-2 py-0.5 rounded-full font-bold mt-1"
                    >
                      Lihat Berkas
                    </a>
                  )}
                </div>

                {/* SIUP */}
                <div className="border border-gray-150 rounded-xl p-3 bg-gray-50 text-center flex flex-col justify-between items-center min-h-[110px]">
                  <div>
                    <span className="text-lg block">💼</span>
                    <span className="text-[10px] font-bold text-gray-800 block mt-1">Nomor SIUP</span>
                    <span className={`text-[9px] font-semibold block mt-0.5 ${activeSupplier.siup_number ? 'text-gray-600' : 'text-red-500 italic'}`}>
                      {activeSupplier.siup_number || 'Belum diisi'}
                    </span>
                  </div>
                  {activeSupplier.siup_doc_path && (
                    <a
                      href={`${apiClient.defaults.baseURL.replace('/app', '')}/${activeSupplier.siup_doc_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-2 py-0.5 rounded-full font-bold mt-1"
                    >
                      Lihat Berkas
                    </a>
                  )}
                </div>

                {/* NPWP */}
                <div className="border border-gray-150 rounded-xl p-3 bg-gray-50 text-center flex flex-col justify-between items-center min-h-[110px]">
                  <div>
                    <span className="text-lg block">💳</span>
                    <span className="text-[10px] font-bold text-gray-800 block mt-1">NPWP Pemasok</span>
                    <span className={`text-[9px] font-semibold block mt-0.5 ${activeSupplier.npwp_number ? 'text-gray-650' : 'text-red-500 italic'}`}>
                      {activeSupplier.npwp_number || 'Belum diisi'}
                    </span>
                  </div>
                  {activeSupplier.npwp_doc_path && (
                    <a
                      href={`${apiClient.defaults.baseURL.replace('/app', '')}/${activeSupplier.npwp_doc_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-2 py-0.5 rounded-full font-bold mt-1"
                    >
                      Lihat Berkas
                    </a>
                  )}
                </div>

                {/* Prima 3 */}
                <div className="border border-gray-150 rounded-xl p-3 bg-gray-50 text-center flex flex-col justify-center items-center min-h-[110px]">
                  <span className="text-lg block">🛡️</span>
                  <span className="text-[10px] font-bold text-indigo-700 block mt-1">Sertifikat Prima 3</span>
                  <span className={`text-[9px] font-semibold block mt-0.5 ${activeSupplier.prima3_cert_number ? 'text-gray-650' : 'text-red-500 italic'}`}>
                    {activeSupplier.prima3_cert_number || 'Belum diisi'}
                  </span>
                </div>

                {/* Bank Account */}
                <div className="border border-gray-150 rounded-xl p-3 bg-gray-50 text-center flex flex-col justify-center items-center min-h-[110px] col-span-2 md:col-span-1">
                  <span className="text-lg block">🏦</span>
                  <span className="text-[10px] font-bold text-gray-800 block mt-1">Rekening Bank</span>
                  {activeSupplier.bank_account_number ? (
                    <div className="text-[9px] text-gray-600 font-medium mt-0.5 space-y-0.5">
                      <p className="font-extrabold text-gray-800">{activeSupplier.bank_name}</p>
                      <p className="font-mono text-emerald-700 font-bold">{activeSupplier.bank_account_number}</p>
                      <p className="text-[8px] text-gray-400 font-bold uppercase">a/n {activeSupplier.bank_owner_name}</p>
                    </div>
                  ) : (
                    <span className={`text-[9px] font-semibold block mt-0.5 ${activeSupplier.bank_account_info ? 'text-gray-650' : 'text-red-500 italic'}`}>
                      {activeSupplier.bank_account_info || 'Belum diisi'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Peta Lokasi Gudang */}
            <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-extrabold text-sm text-gray-800 flex items-center gap-1.5"><MapPin size={18} className="text-blue-500" /> Lokasi & Cakupan Radius Delivery</h4>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-650 bg-gray-50 p-4 rounded-xl border border-gray-150">
                <div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">Koordinat GPS</p>
                  <p className="font-mono mt-0.5">{parseFloat(activeSupplier.latitude || 0).toFixed(6)}, {parseFloat(activeSupplier.longitude || 0).toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">Radius Layanan</p>
                  <p className="mt-0.5">{activeSupplier.coverage_radius_km || 15} km</p>
                </div>
              </div>
              <div ref={mapContainerRef} className="h-48 rounded-xl overflow-hidden border border-gray-250 z-0" />
            </div>
          </div>

          {/* 3. Katalog Produk Supplier dengan Komisi Kustom Per Item */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col">
            <div>
              <h4 className="font-extrabold text-sm text-gray-800 flex items-center gap-1.5 mb-3">
                <Layers size={18} className="text-indigo-500" /> Moderasi Katalog & Komisi Per Item
              </h4>

              {/* Info Hirarki Komisi */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 flex items-start gap-2 mb-3">
                <Tag size={12} className="flex-shrink-0 mt-0.5" />
                <span>Komisi kustom per item adalah <strong>Prioritas 1</strong> (mengesampingkan tarif flat supplier & kategori global).</span>
              </div>

              {/* Notifikasi simpan komisi */}
              {commMsg && (
                <div className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 mb-3 ${commMsg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {commMsg.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  {commMsg.text}
                </div>
              )}
              
              {loadingProducts ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-green-600" size={24} /></div>
              ) : supplierProducts.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400 italic">Supplier belum mengunggah produk.</div>
              ) : (
                <div className="overflow-hidden border border-gray-150 rounded-xl">
                  <table className="w-full text-xs text-left text-gray-500">
                    <thead className="bg-gray-50 border-b text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-4 py-3">Nama Bahan</th>
                        <th className="px-4 py-3">Harga Dasar</th>
                        <th className="px-4 py-3">Komisi Kustom</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {supplierProducts.map((p) => {
                        const isEditingComm = editingCommId === p.id;
                        const hasCustomComm = p.custom_commission_pct !== null && p.custom_commission_pct !== undefined;

                        return (
                          <tr key={p.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3">
                              <span className="font-bold text-gray-800">{p.ingredient_name}</span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-700">
                              {formatCurrency(p.base_price)} / {p.unit_symbol}
                            </td>

                            {/* Inline custom commission per item */}
                            <td className="px-4 py-3">
                              {isEditingComm ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.5"
                                      value={editCommPct}
                                      onChange={(e) => setEditCommPct(e.target.value)}
                                      placeholder="Kosong=hapus"
                                      autoFocus
                                      className="w-24 text-[10px] border border-purple-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400"
                                    />
                                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400">%</span>
                                  </div>
                                  <button
                                    onClick={() => handleSaveCustomCommission(p.id)}
                                    disabled={savingComm}
                                    className="p-1 rounded-md bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200 cursor-pointer"
                                  >
                                    {savingComm ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                                  </button>
                                  <button
                                    onClick={() => setEditingCommId(null)}
                                    className="p-1 rounded-md bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-200 cursor-pointer"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              ) : hasCustomComm ? (
                                <div className="flex items-center gap-1">
                                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                    <Percent size={9} />
                                    {parseFloat(p.custom_commission_pct).toFixed(1)}%
                                  </span>
                                  <button
                                    onClick={() => { setEditingCommId(p.id); setEditCommPct(p.custom_commission_pct); }}
                                    className="p-0.5 rounded text-gray-300 hover:text-purple-500 cursor-pointer"
                                  >
                                    <Edit2 size={10} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setEditingCommId(p.id); setEditCommPct(''); }}
                                  className="text-[10px] text-gray-400 border border-dashed border-gray-300 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 px-2 py-0.5 rounded-lg cursor-pointer transition-all"
                                >
                                  + Atur Kustom
                                </button>
                              )}
                            </td>

                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleToggleProduct(p.id, p.is_active)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                                  parseInt(p.is_active) === 1
                                    ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                              >
                                {parseInt(p.is_active) === 1 ? 'Tangguhkan' : 'Aktifkan'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="border-t pt-4 flex items-center justify-between text-xs text-gray-500 mt-auto">
              <span className="font-semibold">Kontak Supplier:</span>
              <a
                href={`https://wa.me/${activeSupplier.phone_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all cursor-pointer shadow-sm"
              >
                <Phone size={14} />
                <span>WhatsApp Pemasok</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT VIEW: LIST OF SUPPLIERS
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Cari nama supplier atau kontak person..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-style w-full pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        </div>
        <button
          onClick={fetchSuppliers}
          className="text-xs font-bold text-green-600 hover:text-green-800 transition-colors bg-green-50 px-3 py-2 rounded-xl border border-green-200 cursor-pointer"
        >
          Penyegaran Data
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={32} /></div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center text-gray-400 italic">
          Tidak ada supplier ditemukan.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-150 rounded-2xl">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4">Nama Supplier</th>
                <th className="px-6 py-4">Kontak & WA</th>
                <th className="px-6 py-4">Status Verifikasi</th>
                <th className="px-6 py-4 text-right">Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSuppliers.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{item.supplier_name}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5 max-w-xs">{item.address || '-'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-700">{item.contact_person}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{item.phone_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    {parseInt(item.is_verified) === 1 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <ShieldAlert size={12} /> Pending Audit
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => setActiveSupplier(item)}
                      className="px-4 py-2 rounded-xl text-xs font-extrabold bg-green-600 hover:bg-green-700 text-white shadow-sm cursor-pointer transition-all hover:-translate-y-0.5"
                    >
                      Kelola Supplier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SupplierVerificationView;
