import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/api';
import { Store, ShieldCheck, ShieldAlert, Layers, Loader2, DollarSign, Percent, BarChart } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function AdminSummaryView() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val || 0);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/admin_summary.php');
        setStats(response.data);
      } catch (err) {
        console.error("Gagal memuat statistik admin", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (loading || !stats || !stats.suppliers || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default Jakarta center
    const defaultCenter = [-6.2088, 106.8456];
    const map = L.map(mapContainerRef.current).setView(defaultCenter, 11);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const markers = [];

    stats.suppliers.forEach(supplier => {
      const lat = parseFloat(supplier.latitude);
      const lng = parseFloat(supplier.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const marker = L.marker([lat, lng]).addTo(map);
      
      const popupContent = `
        <div style="font-family: sans-serif; padding: 4px; min-width: 200px;">
          <h4 style="margin: 0 0 4px 0; font-weight: bold; color: #1f2937; font-size: 13px;">${supplier.supplier_name}</h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #6b7280; line-height: 1.4;">${supplier.address}</p>
          <div style="font-size: 11px; margin-bottom: 6px; color: #374151;">
            <strong>PIC:</strong> ${supplier.contact_person} <br/>
            <strong>WhatsApp:</strong> ${supplier.phone_number}
          </div>
          <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 9px; font-weight: bold; ${
            supplier.is_verified == 1 
              ? 'background-color: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;' 
              : 'background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a;'
          }">
            ${supplier.is_verified == 1 ? 'Verified Supplier' : 'Pending Verification'}
          </span>
        </div>
      `;

      marker.bindPopup(popupContent);
      markers.push(marker);
    });

    if (markers.length > 0) {
      const group = new L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.15));
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading, stats]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="animate-spin text-green-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-150 p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-green-800">Selamat datang, Super Admin B2B!</h3>
        <p className="text-xs text-green-700 mt-1 leading-relaxed">
          Di halaman konsolidasi ini, Anda dapat memantau jaringan supplier nasional, melakukan verifikasi akun supplier baru agar layak dipesan dapur, memantau katalog produk, serta melacak total fee platform B2B.
        </p>
      </div>

      {/* KPI 6 CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1: Total Supplier */}
        <div className="bg-white border rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-55 flex items-center justify-center text-gray-500 flex-shrink-0">
            <Store size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Total Supplier</p>
            <p className="text-lg font-extrabold text-gray-800">{stats?.total_suppliers || 0}</p>
          </div>
        </div>

        {/* Card 2: Verified Supplier */}
        <div className="bg-white border rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Terverifikasi</p>
            <p className="text-lg font-extrabold text-green-700">{stats?.verified_suppliers || 0}</p>
          </div>
        </div>

        {/* Card 3: Pending Verification */}
        <div className="bg-white border rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Belum Verifikasi</p>
            <p className="text-lg font-extrabold text-amber-700">{stats?.unverified_suppliers || 0}</p>
          </div>
        </div>

        {/* Card 4: Total Products */}
        <div className="bg-white border rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Total Produk</p>
            <p className="text-lg font-extrabold text-blue-700">{stats?.total_products || 0}</p>
          </div>
        </div>

        {/* Card 5: Total GMV */}
        <div className="bg-white border rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Total GMV Omzet</p>
            <p className="text-sm font-black text-emerald-700 truncate">{formatCurrency(stats?.total_gmv)}</p>
          </div>
        </div>

        {/* Card 6: Platform Fee */}
        <div className="bg-white border rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
            <Percent size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Fee Platform</p>
            <p className="text-sm font-black text-purple-700 truncate">{formatCurrency(stats?.total_platform_fee)}</p>
          </div>
        </div>
      </div>

      {/* Financial Table per Supplier */}
      <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
        <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-1.5">
          <BarChart size={18} className="text-green-600" />
          <span>Laporan Keuangan & Kontribusi Fee Platform Supplier B2B</span>
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-gray-500">
            <thead className="text-[10px] text-gray-400 font-bold uppercase bg-gray-55 border-b">
              <tr>
                <th className="px-6 py-3">Nama Supplier</th>
                <th className="px-6 py-3 text-center">Total Order Sukses</th>
                <th className="px-6 py-3 text-right">Omzet Kotor (GMV)</th>
                <th className="px-6 py-3 text-right">Fee Platform Disetor (3-5%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.supplier_financials?.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3.5 font-bold text-gray-800">{item.supplier_name}</td>
                  <td className="px-6 py-3.5 text-center font-semibold text-gray-700">{item.total_orders} Order</td>
                  <td className="px-6 py-3.5 text-right font-bold text-gray-700">{formatCurrency(item.total_gmv)}</td>
                  <td className="px-6 py-3.5 text-right font-black text-purple-650">{formatCurrency(item.total_fee)}</td>
                </tr>
              ))}
              {(!stats?.supplier_financials || stats.supplier_financials.length === 0) && (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-gray-400 italic">Belum ada data transaksi finansial terekam.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leaflet Map Sebaran */}
      <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
        <h4 className="text-sm font-bold text-gray-800 mb-4">Peta Sebaran Supplier B2B</h4>
        <div ref={mapContainerRef} className="h-96 rounded-xl border border-gray-200 overflow-hidden relative z-0" />
      </div>

      {/* Advanced Section: SLA Rankings & Logistics Delay Warning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SLA Rankings */}
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
          <h4 className="text-sm font-bold text-gray-850 mb-4">🏆 Peringkat Keandalan SLA Supplier</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-gray-500">
              <thead className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-55 border-b">
                <tr>
                  <th className="px-4 py-2.5">Supplier</th>
                  <th className="px-4 py-2.5 text-center">Rating</th>
                  <th className="px-4 py-2.5 text-center">SLA Score</th>
                  <th className="px-4 py-2.5 text-center">Waktu Proses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats?.sla_rankings?.map((r, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 font-bold text-gray-700">{r.supplier_name}</td>
                    <td className="px-4 py-2.5 text-center font-semibold text-amber-500">⭐️ {parseFloat(r.average_rating || 0).toFixed(1)}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-emerald-600">{parseFloat(r.sla_score || 100).toFixed(1)}%</td>
                    <td className="px-4 py-2.5 text-center text-gray-650 font-semibold">{parseFloat(r.avg_process_time_hours || 0).toFixed(1)} jam</td>
                  </tr>
                ))}
                {(!stats?.sla_rankings || stats.sla_rankings.length === 0) && (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-gray-400 italic">Belum ada data SLA terkalkulasi.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delay Warnings */}
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-gray-850">⚠️ Peringatan Keterlambatan Logistik</h4>
          <p className="text-[11px] text-gray-400 font-semibold">Mendeteksi supplier dengan rata-rata waktu proses pesanan melampaui toleransi 24 jam.</p>
          
          <div className="space-y-3">
            {stats?.sla_rankings?.filter(r => parseFloat(r.avg_process_time_hours) > 24).map((r, idx) => (
              <div key={idx} className="p-4 bg-amber-50/60 border border-amber-250 rounded-xl flex flex-col justify-between gap-2">
                <div>
                  <h5 className="font-bold text-xs text-amber-800">{r.supplier_name}</h5>
                  <p className="text-[10px] text-amber-700 mt-1 font-semibold">
                    Waktu proses rata-rata mencapai <span className="font-extrabold text-red-600">{parseFloat(r.avg_process_time_hours).toFixed(1)} jam</span>. Ini berpotensi menghambat distribusi dapur gizi.
                  </p>
                </div>
                <a 
                  href={`https://wa.me/${r.phone_number || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-end px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition-colors"
                >
                  Hubungi Supplier
                </a>
              </div>
            ))}
            {(!stats?.sla_rankings || stats.sla_rankings.filter(r => parseFloat(r.avg_process_time_hours) > 24).length === 0) && (
              <div className="p-8 text-center text-xs font-semibold text-emerald-600 bg-emerald-50/30 border border-emerald-100 rounded-xl">
                ✅ Semua logistik supplier berjalan lancar & tepat waktu di bawah 24 jam!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSummaryView;
