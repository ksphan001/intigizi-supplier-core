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
  AlertCircle
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
  useEffect(() => {
    if (!activeSupplier) {
      setSupplierProducts([]);
      return;
    }

    const fetchSupplierProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await apiClient.get('/admin_products.php');
        const all = Array.isArray(response.data) ? response.data : [];
        // Filter by supplier name or ID
        const filtered = all.filter(p => p.supplier_name === activeSupplier.supplier_name);
        setSupplierProducts(filtered);
      } catch (err) {
        console.error("Gagal memuat produk supplier", err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchSupplierProducts();
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

    // Coverage Area Circle
    const radius = (activeSupplier.coverage_radius_km || 15) * 1000;
    L.circle([lat, lng], {
      color: '#10B981',
      fillColor: '#10B981',
      fillOpacity: 0.15,
      radius: radius
    }).addTo(map);

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

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
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      await apiClient.put('/admin_suppliers.php', { id: supplier.id, is_verified: newStatus });
      setMessage('Status verifikasi supplier berhasil diperbarui!');
      
      // Update local state
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
      // Refresh local supplier products list
      setSupplierProducts(prev => prev.map(p => p.id === prodId ? { ...p, is_active: newStatus } : p));
    } catch (err) {
      alert("Gagal memperbarui status produk.");
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
    // RENDER SUPPLIER DETAIL & MANAGEMENT CONSOLE
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
                activeSupplier.is_verified === 1
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {actionId === activeSupplier.id ? (
                <Loader2 className="animate-spin" size={14} />
              ) : activeSupplier.is_verified === 1 ? (
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
                <div className="border border-gray-150 rounded-xl p-3 bg-gray-50 text-center">
                  <span className="text-lg block">📄</span>
                  <span className="text-[10px] font-bold text-gray-800 block mt-1">Nomor NIB</span>
                  <span className={`text-[9px] font-semibold block mt-0.5 ${activeSupplier.nib_number ? 'text-gray-600' : 'text-red-500 italic'}`}>
                    {activeSupplier.nib_number || 'Belum diisi'}
                  </span>
                </div>
                <div className="border border-gray-150 rounded-xl p-3 bg-gray-50 text-center">
                  <span className="text-lg block">📜</span>
                  <span className="text-[10px] font-bold text-emerald-700 block mt-1">Sertifikat Halal</span>
                  <span className={`text-[9px] font-semibold block mt-0.5 ${activeSupplier.halal_cert_number ? 'text-gray-600' : 'text-red-500 italic'}`}>
                    {activeSupplier.halal_cert_number || 'Belum diisi'}
                  </span>
                </div>
                <div className="border border-gray-150 rounded-xl p-3 bg-gray-50 text-center">
                  <span className="text-lg block">💼</span>
                  <span className="text-[10px] font-bold text-gray-800 block mt-1">Nomor SIUP</span>
                  <span className={`text-[9px] font-semibold block mt-0.5 ${activeSupplier.siup_number ? 'text-gray-600' : 'text-red-500 italic'}`}>
                    {activeSupplier.siup_number || 'Belum diisi'}
                  </span>
                </div>
                <div className="border border-gray-150 rounded-xl p-3 bg-gray-50 text-center">
                  <span className="text-lg block">💳</span>
                  <span className="text-[10px] font-bold text-gray-800 block mt-1">NPWP Pemasok</span>
                  <span className={`text-[9px] font-semibold block mt-0.5 ${activeSupplier.npwp_number ? 'text-gray-650' : 'text-red-500 italic'}`}>
                    {activeSupplier.npwp_number || 'Belum diisi'}
                  </span>
                </div>
                <div className="border border-gray-150 rounded-xl p-3 bg-gray-50 text-center">
                  <span className="text-lg block">🛡️</span>
                  <span className="text-[10px] font-bold text-indigo-700 block mt-1">Sertifikat Prima 3</span>
                  <span className={`text-[9px] font-semibold block mt-0.5 ${activeSupplier.prima3_cert_number ? 'text-gray-650' : 'text-red-500 italic'}`}>
                    {activeSupplier.prima3_cert_number || 'Belum diisi'}
                  </span>
                </div>
                <div className="border border-gray-150 rounded-xl p-3 bg-gray-50 text-center">
                  <span className="text-lg block">🏦</span>
                  <span className="text-[10px] font-bold text-gray-800 block mt-1">Rekening Bank</span>
                  <span className={`text-[9px] font-semibold block mt-0.5 ${activeSupplier.bank_account_info ? 'text-gray-650 font-mono' : 'text-red-500 italic'}`}>
                    {activeSupplier.bank_account_info || 'Belum diisi'}
                  </span>
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

          {/* 3. Katalog Produk Supplier */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-gray-800 flex items-center gap-1.5 mb-4"><Layers size={18} className="text-indigo-500" /> Moderasi Katalog Bahan Makanan</h4>
              
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
                        <th className="px-4 py-3 text-right">Aksi Moderasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {supplierProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <span className="font-bold text-gray-800">{p.ingredient_name}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-700">
                            {formatCurrency(p.base_price)} / {p.unit_symbol}
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
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="border-t pt-4 flex items-center justify-between text-xs text-gray-500">
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
                    {item.is_verified === 1 ? (
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
