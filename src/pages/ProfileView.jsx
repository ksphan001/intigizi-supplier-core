import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Save, Loader2 } from 'lucide-react';

import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function ProfileView() {
  const [formData, setFormData] = useState({
    supplier_name: '',
    contact_person: '',
    phone_number: '',
    address: '',
    latitude: '',
    longitude: '',
    coverage_radius_km: 15,
    nib_number: '',
    halal_cert_number: '',
    siup_number: '',
    npwp_number: '',
    prima3_cert_number: '',
    bank_account_info: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showMap, setShowMap] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [isVerified, setIsVerified] = useState(false);
  const [profileStats, setProfileStats] = useState({
    average_rating: 0.00,
    review_count: 0,
    sla_score: 100.00,
    avg_process_time_hours: 0.00
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/supplier_profile.php');
        const data = response.data;
        setIsVerified(!!data.is_verified);
        setProfileStats({
          average_rating: parseFloat(data.average_rating || 0),
          review_count: parseInt(data.review_count || 0),
          sla_score: parseFloat(data.sla_score || 100),
          avg_process_time_hours: parseFloat(data.avg_process_time_hours || 0)
        });
        setFormData({
          supplier_name: data.supplier_name || '',
          contact_person: data.contact_person || '',
          phone_number: data.phone_number || '',
          address: data.address || '',
          latitude: data.latitude || '',
          longitude: data.longitude || '',
          coverage_radius_km: data.coverage_radius_km || 15,
          nib_number: data.nib_number || '',
          halal_cert_number: data.halal_cert_number || '',
          siup_number: data.siup_number || '',
          npwp_number: data.npwp_number || '',
          prima3_cert_number: data.prima3_cert_number || '',
          bank_account_info: data.bank_account_info || ''
        });
      } catch (err) {
        console.error("Gagal memuat profil", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Leaflet map initialization
  useEffect(() => {
    if (!showMap || !mapContainerRef.current) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    // Default center (Jakarta) or saved coordinates
    const initLat = parseFloat(formData.latitude) || -6.175392;
    const initLng = parseFloat(formData.longitude) || 106.827153;

    const map = L.map(mapContainerRef.current).setView([initLat, initLng], 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const marker = L.marker([initLat, initLng], { draggable: true }).addTo(map);
    markerRef.current = marker;

    // Update form coordinates on drag
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      setFormData(prev => ({
        ...prev,
        latitude: position.lat.toFixed(6),
        longitude: position.lng.toFixed(6)
      }));
    });

    // Update marker and form coordinates on map click
    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      setFormData(prev => ({
        ...prev,
        latitude: e.latlng.lat.toFixed(6),
        longitude: e.latlng.lng.toFixed(6)
      }));
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [showMap]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await apiClient.post('/supplier_profile.php', formData);
      setMessage('Profil berhasil diperbarui!');
    } catch (err) {
      setMessage('Gagal memperbarui profil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin text-green-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold border ${message.includes('Gagal') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="text-xs font-bold text-gray-500 uppercase">Status Verifikasi:</div>
          {isVerified ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
              Terverifikasi (Verified Supplier)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Menunggu Verifikasi Administrasi
            </span>
          )}
        </div>
      </div>

      {/* SLA & Rating Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rating Toko</p>
          <p className="text-xl font-extrabold text-gray-800 mt-1">⭐️ {profileStats.average_rating.toFixed(2)}</p>
          <p className="text-[9px] text-gray-400 font-semibold mt-0.5">{profileStats.review_count} Ulasan Dapur</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">SLA Pemenuhan</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">{profileStats.sla_score.toFixed(1)}%</p>
          <p className="text-[9px] text-gray-400 font-semibold mt-0.5">Keandalan Pengiriman</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Waktu Proses</p>
          <p className="text-xl font-extrabold text-gray-800 mt-1">🕒 {profileStats.avg_process_time_hours.toFixed(1)} jam</p>
          <p className="text-[9px] text-gray-400 font-semibold mt-0.5">Rata-rata Kemas</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Cakupan Radius</p>
          <p className="text-xl font-extrabold text-blue-600 mt-1">📍 {formData.coverage_radius_km} km</p>
          <p className="text-[9px] text-gray-400 font-semibold mt-0.5">Area Pengantaran</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nama Toko / Supplier</label>
              <input
                type="text"
                name="supplier_name"
                value={formData.supplier_name}
                onChange={handleChange}
                className="input-style w-full"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nama Kontak Person</label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                className="input-style w-full"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">No. HP / WhatsApp</label>
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="input-style w-full"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Radius Cakupan Layanan (km)</label>
              <input
                type="number"
                name="coverage_radius_km"
                value={formData.coverage_radius_km}
                onChange={handleChange}
                className="input-style w-full"
                min="1"
                required
              />
            </div>
          </div>

          <div className="space-y-4 flex flex-col justify-between">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Alamat Lengkap</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input-style w-full h-24"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Koordinat GPS Dapur</label>
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="text-xs font-bold text-green-600 hover:text-green-800 flex items-center gap-1 transition-colors"
                >
                  <MapPin size={14} />
                  <span>{showMap ? 'Sembunyikan Peta' : 'Pilih Dari Peta'}</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="Latitude"
                  className="input-style w-full text-xs font-mono"
                  required
                />
                <input
                  type="text"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="Longitude"
                  className="input-style w-full text-xs font-mono"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Legalitas & Administrasi */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-800 border-b pb-2">💼 Dokumen Legalitas & Informasi Bank (B2B Compliance)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nomor NIB (Nomor Induk Berusaha)</label>
              <input
                type="text"
                name="nib_number"
                value={formData.nib_number}
                onChange={handleChange}
                placeholder="cth: 120983948293..."
                className="input-style w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nomor Sertifikat Halal MUI</label>
              <input
                type="text"
                name="halal_cert_number"
                value={formData.halal_cert_number}
                onChange={handleChange}
                placeholder="cth: ID-32984920..."
                className="input-style w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nomor SIUP</label>
              <input
                type="text"
                name="siup_number"
                value={formData.siup_number}
                onChange={handleChange}
                placeholder="cth: 503/SIUP/2026..."
                className="input-style w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nomor Pokok Wajib Pajak (NPWP)</label>
              <input
                type="text"
                name="npwp_number"
                value={formData.npwp_number}
                onChange={handleChange}
                placeholder="cth: 81.239.094.2..."
                className="input-style w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nomor Sertifikat Prima 3</label>
              <input
                type="text"
                name="prima3_cert_number"
                value={formData.prima3_cert_number}
                onChange={handleChange}
                placeholder="cth: REG-PR3/2026..."
                className="input-style w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nomor Rekening & Bank Penerima</label>
              <input
                type="text"
                name="bank_account_info"
                value={formData.bank_account_info}
                onChange={handleChange}
                placeholder="cth: BCA - 8023849182 a/n Toko..."
                className="input-style w-full"
              />
            </div>
          </div>
        </div>

        {showMap && (
          <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm relative">
            <div ref={mapContainerRef} className="h-64 w-full z-10" />
            <div className="absolute top-3 right-3 bg-white/95 px-3 py-1.5 rounded-lg shadow-sm border text-[10px] font-semibold text-gray-500 z-20 flex items-center gap-1">
              <Navigation size={12} className="animate-pulse text-green-600" />
              <span>Geser pin atau klik peta untuk menentukan lokasi</span>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>
                <Save size={16} />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfileView;
