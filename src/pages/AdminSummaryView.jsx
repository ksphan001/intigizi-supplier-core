import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/api';
import { Store, ShieldCheck, ShieldAlert, Layers, Loader2 } from 'lucide-react';
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
          Di halaman konsolidasi ini, Anda dapat memantau jaringan supplier nasional, melakukan verifikasi akun supplier baru agar layak dipesan dapur, dan memantau katalog produk.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card 1: Total Supplier */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500">
            <Store size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Total Supplier</p>
            <p className="text-2xl font-extrabold text-gray-800">{stats?.total_suppliers || 0}</p>
          </div>
        </div>

        {/* Card 2: Verified Supplier */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Terverifikasi</p>
            <p className="text-2xl font-extrabold text-green-700">{stats?.verified_suppliers || 0}</p>
          </div>
        </div>

        {/* Card 3: Pending Verification */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Belum Verifikasi</p>
            <p className="text-2xl font-extrabold text-amber-700">{stats?.unverified_suppliers || 0}</p>
          </div>
        </div>

        {/* Card 4: Total Products */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Total Produk</p>
            <p className="text-2xl font-extrabold text-blue-700">{stats?.total_products || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
        <h4 className="text-sm font-bold text-gray-800 mb-4">Peta Sebaran Supplier B2B</h4>
        <div ref={mapContainerRef} className="h-96 rounded-xl border border-gray-200 overflow-hidden relative z-0" />
      </div>
    </div>
  );
}

export default AdminSummaryView;
