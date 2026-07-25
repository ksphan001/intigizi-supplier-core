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
    coverage_radius_km: 15
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showMap, setShowMap] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/supplier_profile.php');
        const data = response.data;
        setIsVerified(!!data.is_verified);
        setFormData({
          supplier_name: data.supplier_name || '',
          contact_person: data.contact_person || '',
          phone_number: data.phone_number || '',
          address: data.address || '',
          latitude: data.latitude || '',
          longitude: data.longitude || '',
          coverage_radius_km: data.coverage_radius_km || 15
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

      <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
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
