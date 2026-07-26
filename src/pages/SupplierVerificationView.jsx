import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Loader2,
  CheckCircle2,
  Search,
  ShieldAlert,
  ArrowLeft,
  Phone,
  MapPin,
  FileText,
  Layers,
  X,
  AlertCircle,
  Percent,
  Save,
  Edit2,
  Tag,
  Handshake,
  Info
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

const TABS = [
  { id: 'info', label: 'Informasi & Verifikasi', icon: Info },
  { id: 'catalog', label: 'Katalog & Komisi Item', icon: Layers },
  { id: 'deal', label: 'Kesepakatan Komisi', icon: Handshake },
];

function SupplierVerificationView({ preselectedSupplierName, onClearPreselected }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState(null);
  const [message, setMessage] = useState('');

  // Detail workspace
  const [activeSupplier, setActiveSupplier] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  // Products (catalog tab)
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Per-item commission inline editing
  const [editingCommId, setEditingCommId] = useState(null);
  const [editCommPct, setEditCommPct] = useState('');
  const [savingComm, setSavingComm] = useState(false);
  const [commMsg, setCommMsg] = useState(null);

  // Supplier flat-rate deal (deal tab)
  const [dealPct, setDealPct] = useState('');
  const [editingDeal, setEditingDeal] = useState(false);
  const [savingDeal, setSavingDeal] = useState(false);
  const [dealMsg, setDealMsg] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Auto-expand pre-selected supplier
  useEffect(() => {
    if (preselectedSupplierName && suppliers.length > 0) {
      const match = suppliers.find(s => s.supplier_name.toLowerCase() === preselectedSupplierName.toLowerCase());
      if (match) { setActiveSupplier(match); setActiveTab('info'); }
      onClearPreselected();
    }
  }, [preselectedSupplierName, suppliers, onClearPreselected]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin_suppliers.php');
      setSuppliers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Gagal mengambil data supplier", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  // Fetch products when catalog tab becomes active
  const fetchSupplierProducts = async (supplier) => {
    setLoadingProducts(true);
    try {
      const res = await apiClient.get('/admin_products.php');
      const all = Array.isArray(res.data) ? res.data : [];
      setSupplierProducts(all.filter(p => p.supplier_name === supplier.supplier_name));
    } catch (err) {
      console.error("Gagal memuat produk supplier", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // When supplier or tab changes
  useEffect(() => {
    if (!activeSupplier) { setSupplierProducts([]); return; }
    if (activeTab === 'catalog') fetchSupplierProducts(activeSupplier);
    // Pre-fill deal pct from supplier data
    if (activeTab === 'deal') {
      setDealPct(activeSupplier.custom_flat_fee_pct !== null && activeSupplier.custom_flat_fee_pct !== undefined
        ? String(activeSupplier.custom_flat_fee_pct) : '');
      setEditingDeal(false);
      setDealMsg(null);
    }
  }, [activeSupplier, activeTab]);

  // Leaflet map
  useEffect(() => {
    if (activeTab !== 'info' || !activeSupplier || !mapContainerRef.current) return;
    const lat = parseFloat(activeSupplier.latitude);
    const lng = parseFloat(activeSupplier.longitude);
    if (isNaN(lat) || isNaN(lng)) return;
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    const map = L.map(mapContainerRef.current).setView([lat, lng], 13);
    mapInstanceRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
    L.marker([lat, lng]).addTo(map).bindPopup(activeSupplier.supplier_name).openPopup();
    L.circle([lat, lng], { color: '#10B981', fillColor: '#10B981', fillOpacity: 0.15, radius: (activeSupplier.coverage_radius_km || 15) * 1000 }).addTo(map);
    setTimeout(() => map.invalidateSize(), 200);
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [activeSupplier, activeTab]);

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

  const handleSaveCustomCommission = async (prodId) => {
    setSavingComm(true);
    setCommMsg(null);
    try {
      const pct = editCommPct === '' ? null : parseFloat(editCommPct);
      await apiClient.post('/admin_products.php', { action: 'set_custom_commission', id: prodId, custom_commission_pct: pct });
      setCommMsg({ type: 'success', text: pct === null ? 'Komisi kustom dihapus. Kembali ke tarif global.' : `Komisi kustom ${pct}% disimpan.` });
      setEditingCommId(null);
      fetchSupplierProducts(activeSupplier);
    } catch (err) {
      setCommMsg({ type: 'error', text: 'Gagal menyimpan komisi kustom.' });
    } finally {
      setSavingComm(false);
      setTimeout(() => setCommMsg(null), 3500);
    }
  };

  const handleSaveDeal = async () => {
    setSavingDeal(true);
    setDealMsg(null);
    try {
      const pct = dealPct === '' ? null : parseFloat(dealPct);
      await apiClient.post('/admin_supplier_deals.php', { supplier_id: activeSupplier.id, custom_flat_fee_pct: pct });
      const updatedSupplier = { ...activeSupplier, custom_flat_fee_pct: pct };
      setActiveSupplier(updatedSupplier);
      setEditingDeal(false);
      setDealMsg({ type: 'success', text: pct === null ? 'Kesepakatan komisi dihapus. Kembali ke tarif kategori global.' : `Flat rate komisi ${pct}% berhasil disimpan.` });
      fetchSuppliers();
    } catch (err) {
      setDealMsg({ type: 'error', text: 'Gagal menyimpan kesepakatan komisi.' });
    } finally {
      setSavingDeal(false);
      setTimeout(() => setDealMsg(null), 4000);
    }
  };

  const openSupplier = (supplier) => {
    setActiveSupplier(supplier);
    setActiveTab('info');
    setMessage('');
    setEditingCommId(null);
    setEditingDeal(false);
    setCommMsg(null);
    setDealMsg(null);
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_person.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  // ─── DETAIL VIEW ────────────────────────────────────────────────────────────
  if (activeSupplier) {
    const hasDeal = activeSupplier.custom_flat_fee_pct !== null && activeSupplier.custom_flat_fee_pct !== undefined;

    return (
      <div className="space-y-0">
        {/* Top bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-6 gap-4">
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
                parseInt(activeSupplier.is_verified) === 1 ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {actionId === activeSupplier.id ? <Loader2 className="animate-spin" size={14} /> :
               parseInt(activeSupplier.is_verified) === 1 ? 'Tangguhkan Verifikasi' : 'Setujui & Verifikasi Akun'}
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-4 p-4 rounded-xl text-sm font-semibold border bg-green-50 border-green-200 text-green-700">{message}</div>
        )}

        {/* Supplier header card */}
        <div className="bg-white border rounded-2xl px-6 py-5 shadow-sm flex flex-col md:flex-row justify-between gap-4 mb-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-extrabold text-gray-800">{activeSupplier.supplier_name}</h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase">
                ID: SP-{String(activeSupplier.id).padStart(4, '0')}
              </span>
              {parseInt(activeSupplier.is_verified) === 1 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                  <CheckCircle2 size={12} /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <ShieldAlert size={12} /> Pending Audit
                </span>
              )}
              {hasDeal && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <Handshake size={11} /> Flat Rate {parseFloat(activeSupplier.custom_flat_fee_pct).toFixed(1)}%
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1 font-semibold flex items-center gap-1"><MapPin size={13} /> {activeSupplier.address}</p>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center border-l pl-6 shrink-0">
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

        {/* ── TAB NAV ── */}
        <div className="border-b border-gray-200 mt-6 mb-0">
          <nav className="-mb-px flex gap-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-green-600 text-green-700 bg-green-50/40'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  {tab.id === 'deal' && hasDeal && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── TAB CONTENT ── */}
        <div className="bg-white border border-t-0 rounded-b-2xl p-6 shadow-sm">

          {/* ── TAB 1: INFO & VERIFIKASI ── */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dokumen Legalitas */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-sm text-gray-800 flex items-center gap-1.5">
                  <FileText size={18} className="text-emerald-500" /> Dokumen & Legalitas Hukum
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { icon: '🪪', label: 'KTP Pemilik', field: 'ktp_doc_path', num: null },
                    { icon: '📄', label: 'Nomor NIB', field: 'nib_doc_path', num: 'nib_number' },
                    { icon: '📜', label: 'Sertifikat Halal', field: 'halal_doc_path', num: 'halal_cert_number' },
                    { icon: '💼', label: 'Nomor SIUP', field: 'siup_doc_path', num: 'siup_number' },
                    { icon: '💳', label: 'NPWP Pemasok', field: 'npwp_doc_path', num: 'npwp_number' },
                    { icon: '🛡️', label: 'Sertifikat Prima 3', field: null, num: 'prima3_cert_number' },
                  ].map((doc) => (
                    <div key={doc.label} className="border border-gray-150 rounded-xl p-3 bg-gray-50 text-center flex flex-col justify-between items-center min-h-[100px]">
                      <div>
                        <span className="text-lg block">{doc.icon}</span>
                        <span className="text-[10px] font-bold text-gray-800 block mt-1">{doc.label}</span>
                        {doc.num && (
                          <span className={`text-[9px] font-semibold block mt-0.5 ${activeSupplier[doc.num] ? 'text-gray-600' : 'text-red-500 italic'}`}>
                            {activeSupplier[doc.num] || 'Belum diisi'}
                          </span>
                        )}
                      </div>
                      {doc.field && activeSupplier[doc.field] ? (
                        <a
                          href={`${apiClient.defaults.baseURL.replace('/app', '')}/${activeSupplier[doc.field]}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-[9px] bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-2 py-0.5 rounded-full font-bold mt-1"
                        >
                          Lihat Berkas
                        </a>
                      ) : !doc.num ? (
                        <span className="text-[9px] text-red-500 font-bold italic mt-1">Belum diisi</span>
                      ) : null}
                    </div>
                  ))}

                  {/* Rekening Bank */}
                  <div className="border border-gray-150 rounded-xl p-3 bg-gray-50 text-center flex flex-col justify-center items-center min-h-[100px] col-span-2 md:col-span-3">
                    <span className="text-lg block">🏦</span>
                    <span className="text-[10px] font-bold text-gray-800 block mt-1">Rekening Bank Payout</span>
                    {activeSupplier.bank_account_number ? (
                      <div className="text-[9px] text-gray-600 font-medium mt-1 space-y-0.5">
                        <p className="font-extrabold text-gray-800">{activeSupplier.bank_name}</p>
                        <p className="font-mono text-emerald-700 font-bold">{activeSupplier.bank_account_number}</p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase">a/n {activeSupplier.bank_owner_name}</p>
                      </div>
                    ) : (
                      <span className="text-[9px] text-red-500 font-bold italic mt-1">{activeSupplier.bank_account_info || 'Belum diisi'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Peta Lokasi */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-sm text-gray-800 flex items-center gap-1.5">
                  <MapPin size={18} className="text-blue-500" /> Lokasi & Cakupan Radius Delivery
                </h4>
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
                <div ref={mapContainerRef} className="h-52 rounded-xl overflow-hidden border border-gray-200 z-0" />

                {/* Kontak */}
                <div className="flex items-center justify-between pt-2 border-t text-xs text-gray-500">
                  <span className="font-semibold">Kontak: <span className="text-gray-800">{activeSupplier.contact_person} · {activeSupplier.phone_number}</span></span>
                  <a
                    href={`https://wa.me/${activeSupplier.phone_number}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Phone size={13} /> WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: KATALOG & KOMISI ITEM ── */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-[11px] text-amber-800 flex items-center gap-2">
                <Tag size={13} className="flex-shrink-0" />
                <span>Komisi kustom per item adalah <strong>Prioritas 1</strong> — mengesampingkan flat rate supplier & tarif kategori global.</span>
              </div>

              {commMsg && (
                <div className={`px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 ${commMsg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {commMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {commMsg.text}
                </div>
              )}

              {loadingProducts ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={28} /></div>
              ) : supplierProducts.length === 0 ? (
                <div className="text-center py-16 text-xs text-gray-400 italic">Supplier belum mengunggah produk ke katalog.</div>
              ) : (
                <div className="overflow-hidden border border-gray-150 rounded-xl">
                  <table className="w-full text-xs text-left text-gray-500">
                    <thead className="bg-gray-50 border-b text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-5 py-3">Nama Bahan</th>
                        <th className="px-5 py-3">Harga Dasar</th>
                        <th className="px-5 py-3">Komisi Kustom Per Item</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {supplierProducts.map((p) => {
                        const isEditingComm = editingCommId === p.id;
                        const hasCustomComm = p.custom_commission_pct !== null && p.custom_commission_pct !== undefined;
                        return (
                          <tr key={p.id} className="hover:bg-gray-50/60">
                            <td className="px-5 py-3 font-bold text-gray-800">{p.ingredient_name}</td>
                            <td className="px-5 py-3 font-semibold text-gray-700">{formatCurrency(p.base_price)} / {p.unit_symbol}</td>
                            <td className="px-5 py-3">
                              {isEditingComm ? (
                                <div className="flex items-center gap-2">
                                  <div className="relative">
                                    <input
                                      type="number" min="0" max="100" step="0.5"
                                      value={editCommPct}
                                      onChange={(e) => setEditCommPct(e.target.value)}
                                      placeholder="Kosong = hapus"
                                      autoFocus
                                      className="w-28 text-[11px] border border-purple-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400">%</span>
                                  </div>
                                  <button onClick={() => handleSaveCustomCommission(p.id)} disabled={savingComm}
                                    className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200 cursor-pointer">
                                    {savingComm ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                                  </button>
                                  <button onClick={() => setEditingCommId(null)}
                                    className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-200 cursor-pointer">
                                    <X size={11} />
                                  </button>
                                </div>
                              ) : hasCustomComm ? (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                    <Percent size={9} /> {parseFloat(p.custom_commission_pct).toFixed(1)}% Kustom
                                  </span>
                                  <button onClick={() => { setEditingCommId(p.id); setEditCommPct(p.custom_commission_pct); }}
                                    className="p-1 rounded text-gray-300 hover:text-purple-600 cursor-pointer">
                                    <Edit2 size={11} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setEditingCommId(p.id); setEditCommPct(''); }}
                                  className="text-[10px] text-gray-400 border border-dashed border-gray-300 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 px-2.5 py-1 rounded-lg cursor-pointer transition-all"
                                >
                                  + Atur Kustom
                                </button>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              {parseInt(p.is_active) === 1 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                                  <CheckCircle2 size={10} /> Aktif
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                                  <AlertCircle size={10} /> Ditangguhkan
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <button
                                onClick={() => handleToggleProduct(p.id, p.is_active)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
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
          )}

          {/* ── TAB 3: KESEPAKATAN KOMISI ── */}
          {activeTab === 'deal' && (
            <div className="max-w-xl space-y-5">
              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800 flex items-start gap-3">
                <Handshake size={18} className="flex-shrink-0 mt-0.5 text-blue-500" />
                <div>
                  <p className="font-bold mb-1">Flat Rate Komisi Khusus Per Supplier (Prioritas 2)</p>
                  <p className="text-blue-700">Tarif ini berlaku untuk <strong>semua item</strong> dari supplier ini, kecuali item yang sudah memiliki komisi kustom per-item (Prioritas 1). Biarkan kosong untuk menggunakan tarif kategori global (Prioritas 3).</p>
                </div>
              </div>

              {dealMsg && (
                <div className={`px-4 py-3 rounded-xl text-sm font-semibold border flex items-center gap-2 ${dealMsg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {dealMsg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  {dealMsg.text}
                </div>
              )}

              {/* Current deal status */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Status Kesepakatan Saat Ini</p>
                    {hasDeal ? (
                      <p className="mt-1.5 text-2xl font-black text-blue-600">
                        {parseFloat(activeSupplier.custom_flat_fee_pct).toFixed(1)}%
                        <span className="text-xs text-blue-400 font-semibold ml-2">flat rate</span>
                      </p>
                    ) : (
                      <p className="mt-1.5 text-sm font-semibold text-gray-400 italic">Menggunakan tarif kategori global (tidak ada kesepakatan khusus)</p>
                    )}
                  </div>
                  {hasDeal && !editingDeal && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <Handshake size={13} /> Aktif
                    </span>
                  )}
                </div>

                {!editingDeal ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditingDeal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-all shadow-sm"
                    >
                      <Edit2 size={13} />
                      {hasDeal ? 'Ubah Kesepakatan' : 'Buat Kesepakatan Baru'}
                    </button>
                    {hasDeal && (
                      <button
                        onClick={() => { setDealPct(''); handleSaveDeal(); }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 cursor-pointer transition-all"
                      >
                        <X size={13} /> Hapus Kesepakatan
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">
                        Masukkan Persentase Flat Rate Baru <span className="text-gray-400 font-normal">(0–100%)</span>
                      </label>
                      <div className="relative w-48">
                        <input
                          type="number" min="0" max="100" step="0.5"
                          value={dealPct}
                          onChange={(e) => setDealPct(e.target.value)}
                          placeholder="Contoh: 2.5"
                          autoFocus
                          className="w-full text-sm border border-blue-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">%</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1.5">Kosongkan input dan simpan untuk menghapus kesepakatan.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveDeal}
                        disabled={savingDeal}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-all shadow-sm"
                      >
                        {savingDeal ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        Simpan Kesepakatan
                      </button>
                      <button
                        onClick={() => setEditingDeal(false)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 border border-gray-200 cursor-pointer transition-all"
                      >
                        <X size={13} /> Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Hierarchy reminder */}
              <div className="border border-gray-150 rounded-xl p-4 bg-gray-50 space-y-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Hirarki Komisi Platform</p>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-[9px] font-black shrink-0">1</span>
                    <span><strong>Komisi Kustom Per Item</strong> — diatur di tab "Katalog & Komisi Item"</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-black shrink-0">2</span>
                    <span><strong>Flat Rate Per Supplier</strong> — diatur di tab ini ← Anda sedang di sini</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-gray-400 text-white flex items-center justify-center text-[9px] font-black shrink-0">3</span>
                    <span><strong>Tarif Kategori Global</strong> — diatur di menu Komisi Platform</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ─── LIST VIEW ────────────────────────────────────────────────────────────
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
        <div className="bg-white border rounded-2xl p-12 text-center text-gray-400 italic">Tidak ada supplier ditemukan.</div>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-150 rounded-2xl">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4">Nama Supplier</th>
                <th className="px-6 py-4">Kontak & WA</th>
                <th className="px-6 py-4">Status Verifikasi</th>
                <th className="px-6 py-4">Kesepakatan Komisi</th>
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
                  <td className="px-6 py-4">
                    {item.custom_flat_fee_pct !== null && item.custom_flat_fee_pct !== undefined ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <Handshake size={11} /> {parseFloat(item.custom_flat_fee_pct).toFixed(1)}% Flat Rate
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Tarif kategori global</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openSupplier(item)}
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
