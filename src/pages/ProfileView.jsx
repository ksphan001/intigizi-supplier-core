import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Save, Loader2, FileText, CheckCircle, Upload, AlertCircle, Building2, User, Globe, DollarSign, Star, Calendar } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('umum'); // 'umum', 'lokasi', 'legalitas', 'bank'

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
    bank_account_info: '',
    ktp_doc_path: '',
    nib_doc_path: '',
    halal_doc_path: '',
    npwp_doc_path: '',
    siup_doc_path: '',
    bank_name: '',
    bank_owner_name: '',
    bank_account_number: ''
  });

  const [files, setFiles] = useState({
    ktp_doc: null,
    nib_doc: null,
    halal_doc: null,
    npwp_doc: null,
    siup_doc: null
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

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const response = await apiClient.get('/supplier_reviews_get.php');
      setReviews(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Gagal memuat ulasan", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ulasan') {
      fetchReviews();
    }
  }, [activeTab]);

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
        bank_account_info: data.bank_account_info || '',
        ktp_doc_path: data.ktp_doc_path || '',
        nib_doc_path: data.nib_doc_path || '',
        halal_doc_path: data.halal_doc_path || '',
        npwp_doc_path: data.npwp_doc_path || '',
        siup_doc_path: data.siup_doc_path || '',
        bank_name: data.bank_name || '',
        bank_owner_name: data.bank_owner_name || '',
        bank_account_number: data.bank_account_number || ''
      });
    } catch (err) {
      console.error("Gagal memuat profil", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Leaflet map initialization
  useEffect(() => {
    if (activeTab !== 'lokasi' || !showMap || !mapContainerRef.current) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    const initLat = parseFloat(formData.latitude) || -6.175392;
    const initLng = parseFloat(formData.longitude) || 106.827153;

    const map = L.map(mapContainerRef.current).setView([initLat, initLng], 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const marker = L.marker([initLat, initLng], { draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const position = marker.getLatLng();
      setFormData(prev => ({
        ...prev,
        latitude: position.lat.toFixed(6),
        longitude: position.lng.toFixed(6)
      }));
    });

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
  }, [showMap, activeTab]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });

    if (files.ktp_doc) data.append('ktp_doc', files.ktp_doc);
    if (files.nib_doc) data.append('nib_doc', files.nib_doc);
    if (files.halal_doc) data.append('halal_doc', files.halal_doc);
    if (files.npwp_doc) data.append('npwp_doc', files.npwp_doc);
    if (files.siup_doc) data.append('siup_doc', files.siup_doc);

    try {
      await apiClient.post('/supplier_profile.php', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage('Profil dan dokumen legalitas berhasil diperbarui!');
      fetchProfile(); // Reload coordinates & file paths
    } catch (err) {
      setMessage('Gagal memperbarui profil.');
    } finally {
      setSaving(false);
    }
  };

  const getFullDocUrl = (path) => {
    if (!path) return null;
    return `${apiClient.defaults.baseURL.replace('/app', '')}/${path}`;
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

      {/* Top Banner Status */}
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

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 gap-2">
        <button
          onClick={() => setActiveTab('umum')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'umum' ? 'border-green-600 text-green-700 font-extrabold' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <User size={14} />
          <span>Informasi Umum</span>
        </button>
        <button
          onClick={() => setActiveTab('lokasi')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'lokasi' ? 'border-green-600 text-green-700 font-extrabold' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Globe size={14} />
          <span>Lokasi & Logistik</span>
        </button>
        <button
          onClick={() => setActiveTab('legalitas')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'legalitas' ? 'border-green-600 text-green-700 font-extrabold' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <FileText size={14} />
          <span>Legalitas & Dokumen</span>
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'bank' ? 'border-green-600 text-green-700 font-extrabold' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <DollarSign size={14} />
          <span>Rekening Bank</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ulasan')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ulasan' ? 'border-green-600 text-green-700 font-extrabold' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Star size={14} />
          <span>Ulasan Dapur ({profileStats.review_count})</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: INFORMASI UMUM */}
        {activeTab === 'umum' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 border rounded-2xl shadow-sm">
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
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Alamat Lengkap Kantor / Gudang</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input-style w-full h-[180px]"
                required
              />
            </div>
          </div>
        )}

        {/* TAB 2: LOKASI & LOGISTIK */}
        {activeTab === 'lokasi' && (
          <div className="space-y-6 bg-white p-6 border rounded-2xl shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <p className="text-[10px] text-gray-400 mt-1.5 font-medium">Jarak maksimal jangkauan logistik pengantaran dari gudang Anda ke dapur penerima.</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Koordinat GPS Gudang</label>
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="text-xs font-bold text-green-600 hover:text-green-800 flex items-center gap-1 transition-colors cursor-pointer"
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

            {showMap && (
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm relative">
                <div ref={mapContainerRef} className="h-72 w-full z-10" />
                <div className="absolute top-3 right-3 bg-white/95 px-3 py-1.5 rounded-lg shadow-sm border text-[10px] font-semibold text-gray-500 z-20 flex items-center gap-1">
                  <Navigation size={12} className="animate-pulse text-green-600" />
                  <span>Geser pin atau klik peta untuk menentukan lokasi</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LEGALITAS & DOKUMEN */}
        {activeTab === 'legalitas' && (
          <div className="space-y-6">
            {/* Prima 3 & NIB Numbers */}
            <div className="bg-white p-6 border rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>

            {/* Document Upload Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* KTP */}
              <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-2xl">🪪</span>
                    {formData.ktp_doc_path ? (
                      <span className="bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-0.5"><CheckCircle size={10} /> TERUNGGAH</span>
                    ) : (
                      <span className="bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-0.5"><AlertCircle size={10} /> DIBUTUHKAN</span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-xs text-gray-800 mt-3">KTP Pemilik / Penanggung Jawab</h4>
                  <p className="text-[10px] text-gray-400 font-medium mt-1">Kartu identitas resmi pemilik supplier untuk validasi akun B2B.</p>
                </div>
                <div className="space-y-3 pt-3 border-t">
                  <input type="file" name="ktp_doc" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" className="hidden" id="file-ktp" />
                  <label htmlFor="file-ktp" className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-gray-300 hover:border-green-600 rounded-xl text-xs font-bold text-gray-600 hover:text-green-700 transition-colors cursor-pointer bg-gray-50/50">
                    <Upload size={14} />
                    <span>{files.ktp_doc ? files.ktp_doc.name : 'Pilih File Baru'}</span>
                  </label>
                  {formData.ktp_doc_path && (
                    <a href={getFullDocUrl(formData.ktp_doc_path)} target="_blank" rel="noopener noreferrer" className="w-full block text-center text-[10px] text-blue-600 font-bold hover:underline">
                      Lihat Dokumen Saat Ini
                    </a>
                  )}
                </div>
              </div>

              {/* NIB */}
              <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-2xl">📄</span>
                    {formData.nib_doc_path ? (
                      <span className="bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-0.5"><CheckCircle size={10} /> TERUNGGAH</span>
                    ) : (
                      <span className="bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-0.5"><AlertCircle size={10} /> BELUM ADA</span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-xs text-gray-800 mt-3">Dokumen NIB (Nomor Induk Berusaha)</h4>
                  <input
                    type="text"
                    name="nib_number"
                    value={formData.nib_number}
                    onChange={handleChange}
                    placeholder="Input Nomor NIB"
                    className="input-style w-full mt-2 text-xs py-1.5"
                  />
                </div>
                <div className="space-y-3 pt-3 border-t">
                  <input type="file" name="nib_doc" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" className="hidden" id="file-nib" />
                  <label htmlFor="file-nib" className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-gray-300 hover:border-green-600 rounded-xl text-xs font-bold text-gray-600 hover:text-green-700 transition-colors cursor-pointer bg-gray-50/50">
                    <Upload size={14} />
                    <span>{files.nib_doc ? files.nib_doc.name : 'Pilih File Baru'}</span>
                  </label>
                  {formData.nib_doc_path && (
                    <a href={getFullDocUrl(formData.nib_doc_path)} target="_blank" rel="noopener noreferrer" className="w-full block text-center text-[10px] text-blue-600 font-bold hover:underline">
                      Lihat Dokumen Saat Ini
                    </a>
                  )}
                </div>
              </div>

              {/* Halal */}
              <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-2xl">📜</span>
                    {formData.halal_doc_path ? (
                      <span className="bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-0.5"><CheckCircle size={10} /> TERUNGGAH</span>
                    ) : (
                      <span className="bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-0.5"><AlertCircle size={10} /> BELUM ADA</span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-xs text-gray-800 mt-3">Sertifikat Halal MUI</h4>
                  <input
                    type="text"
                    name="halal_cert_number"
                    value={formData.halal_cert_number}
                    onChange={handleChange}
                    placeholder="Input Nomor Sertifikat Halal"
                    className="input-style w-full mt-2 text-xs py-1.5"
                  />
                </div>
                <div className="space-y-3 pt-3 border-t">
                  <input type="file" name="halal_doc" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" className="hidden" id="file-halal" />
                  <label htmlFor="file-halal" className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-gray-300 hover:border-green-600 rounded-xl text-xs font-bold text-gray-600 hover:text-green-700 transition-colors cursor-pointer bg-gray-50/50">
                    <Upload size={14} />
                    <span>{files.halal_doc ? files.halal_doc.name : 'Pilih File Baru'}</span>
                  </label>
                  {formData.halal_doc_path && (
                    <a href={getFullDocUrl(formData.halal_doc_path)} target="_blank" rel="noopener noreferrer" className="w-full block text-center text-[10px] text-blue-600 font-bold hover:underline">
                      Lihat Dokumen Saat Ini
                    </a>
                  )}
                </div>
              </div>

              {/* SIUP */}
              <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-2xl">💼</span>
                    {formData.siup_doc_path ? (
                      <span className="bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-0.5"><CheckCircle size={10} /> TERUNGGAH</span>
                    ) : (
                      <span className="bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-0.5"><AlertCircle size={10} /> BELUM ADA</span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-xs text-gray-800 mt-3">Berkas Nomor SIUP</h4>
                  <input
                    type="text"
                    name="siup_number"
                    value={formData.siup_number}
                    onChange={handleChange}
                    placeholder="Input Nomor SIUP"
                    className="input-style w-full mt-2 text-xs py-1.5"
                  />
                </div>
                <div className="space-y-3 pt-3 border-t">
                  <input type="file" name="siup_doc" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" className="hidden" id="file-siup" />
                  <label htmlFor="file-siup" className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-gray-300 hover:border-green-600 rounded-xl text-xs font-bold text-gray-600 hover:text-green-700 transition-colors cursor-pointer bg-gray-50/50">
                    <Upload size={14} />
                    <span>{files.siup_doc ? files.siup_doc.name : 'Pilih File Baru'}</span>
                  </label>
                  {formData.siup_doc_path && (
                    <a href={getFullDocUrl(formData.siup_doc_path)} target="_blank" rel="noopener noreferrer" className="w-full block text-center text-[10px] text-blue-600 font-bold hover:underline">
                      Lihat Dokumen Saat Ini
                    </a>
                  )}
                </div>
              </div>

              {/* NPWP Doc */}
              <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-2xl">💳</span>
                    {formData.npwp_doc_path ? (
                      <span className="bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-0.5"><CheckCircle size={10} /> TERUNGGAH</span>
                    ) : (
                      <span className="bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-0.5"><AlertCircle size={10} /> BELUM ADA</span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-xs text-gray-800 mt-3">Kartu NPWP Perusahaan</h4>
                  <p className="text-[10px] text-gray-400 font-medium mt-1">Unggah scan/foto Kartu NPWP resmi untuk kesesuaian faktur pajak.</p>
                </div>
                <div className="space-y-3 pt-3 border-t">
                  <input type="file" name="npwp_doc" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" className="hidden" id="file-npwp" />
                  <label htmlFor="file-npwp" className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-gray-300 hover:border-green-600 rounded-xl text-xs font-bold text-gray-600 hover:text-green-700 transition-colors cursor-pointer bg-gray-50/50">
                    <Upload size={14} />
                    <span>{files.npwp_doc ? files.npwp_doc.name : 'Pilih File Baru'}</span>
                  </label>
                  {formData.npwp_doc_path && (
                    <a href={getFullDocUrl(formData.npwp_doc_path)} target="_blank" rel="noopener noreferrer" className="w-full block text-center text-[10px] text-blue-600 font-bold hover:underline">
                      Lihat Dokumen Saat Ini
                    </a>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: REKENING BANK */}
        {activeTab === 'bank' && (
          <div className="bg-white p-6 border rounded-2xl shadow-sm space-y-6 max-w-xl">
            <h4 className="font-extrabold text-sm text-gray-800 flex items-center gap-1.5"><Building2 size={18} className="text-green-600" /> Informasi Rekening Bank Terdaftar</h4>
            <p className="text-[11px] text-gray-450 font-semibold">Tolong pastikan data rekening sudah benar untuk kelancaran penarikan saldo dan dana PO transaksi B2B Anda.</p>
            
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nama Bank Penerima</label>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleChange}
                  placeholder="Cth: Bank Central Asia (BCA) / Bank Mandiri"
                  className="input-style w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nama Lengkap Pemilik Rekening</label>
                <input
                  type="text"
                  name="bank_owner_name"
                  value={formData.bank_owner_name}
                  onChange={handleChange}
                  placeholder="Cth: CV. Gizi Prima Raya / Budi Pemasok"
                  className="input-style w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nomor Rekening Bank</label>
                <input
                  type="text"
                  name="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={handleChange}
                  placeholder="Cth: 8023849182"
                  className="input-style w-full font-mono"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ULASAN DAPUR */}
        {activeTab === 'ulasan' && (
          <div className="bg-white p-6 border border-gray-200 rounded-2xl shadow-sm space-y-6">
            <div>
              <h4 className="text-sm font-extrabold text-gray-800">Ulasan & Feedback Dapur Gizi Mitra</h4>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Seluruh ulasan dan saran tertulis yang diberikan dapur setelah pengiriman selesai</p>
            </div>

            {reviewsLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin text-green-600" size={24} />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 text-gray-400 italic font-semibold border border-dashed rounded-xl bg-gray-50/50">
                Belum ada ulasan tertulis dari unit dapur mitra.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-gray-50/50 border border-gray-150 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-gray-800">{rev.kitchen_name}</span>
                        <div className="flex items-center text-amber-500 gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              className={i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} 
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5">
                        <Calendar size={12} />
                        {new Date(rev.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-semibold italic bg-white p-3 rounded-lg border border-gray-100/80">
                      "{rev.comment || 'Hanya memberikan rating bintang.'}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        {activeTab !== 'ulasan' && (
          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2 cursor-pointer"
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
        )}
      </form>
    </div>
  );
}

export default ProfileView;
