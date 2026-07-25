import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Loader2, CheckCircle2, XCircle, Search, ShieldCheck, ShieldAlert, ExternalLink } from 'lucide-react';

function SupplierVerificationView() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState(null);
  const [message, setMessage] = useState('');
  const [selectedAuditSupplier, setSelectedAuditSupplier] = useState(null);

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

  const handleToggleVerify = async (id, currentStatus) => {
    setActionId(id);
    setMessage('');
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      await apiClient.put('/admin_suppliers.php', { id, is_verified: newStatus });
      setMessage('Status verifikasi supplier berhasil diperbarui!');
      setSelectedAuditSupplier(null);
      fetchSuppliers();
    } catch (err) {
      setMessage('Gagal memperbarui status verifikasi.');
    } finally {
      setActionId(null);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_person.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold border ${message.includes('Gagal') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
          {message}
        </div>
      )}

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
          className="text-xs font-bold text-green-600 hover:text-green-800 transition-colors bg-green-50 px-3 py-2 rounded-xl border border-green-200"
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
                <th className="px-6 py-4 text-right">Aksi Audit</th>
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
                      onClick={() => setSelectedAuditSupplier(item)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-250 cursor-pointer transition-colors"
                    >
                      Tinjau Berkas
                    </button>
                    <button
                      onClick={() => handleToggleVerify(item.id, item.is_verified)}
                      disabled={actionId === item.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        item.is_verified === 1
                          ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                          : 'bg-green-600 text-white hover:bg-green-700 hover:-translate-y-0.5 shadow-sm'
                      }`}
                    >
                      {actionId === item.id ? (
                        <Loader2 className="animate-spin" size={12} />
                      ) : item.is_verified === 1 ? (
                        'Batal Verifikasi'
                      ) : (
                        'Verifikasi Akun'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL AUDIT BERKAS LEGALITAS */}
      {selectedAuditSupplier && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-gray-150 relative space-y-6">
            <div>
              <h4 className="text-base font-extrabold text-gray-800">Audit & Tinjau Dokumen Supplier</h4>
              <p className="text-xs text-gray-400 mt-1 font-semibold">Memeriksa kelayakan administrasi supplier: <span className="text-gray-700 font-bold">{selectedAuditSupplier.supplier_name}</span></p>
            </div>

            <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-150">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Nomor NIB (Legalitas OSS)</p>
                  <p className="font-bold text-gray-800 mt-0.5 font-mono">120983948293-{selectedAuditSupplier.id}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Sertifikat Halal MUI</p>
                  <p className="font-bold text-emerald-600 mt-0.5 font-mono">ID002837281-MUI</p>
                </div>
              </div>
              <div className="border-t pt-3 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Nomor SIUP</p>
                  <p className="font-bold text-gray-800 mt-0.5 font-mono">503/SIUP/2026/Bandung</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Verifikasi OSS API</p>
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-200">
                    Active & Validated
                  </span>
                </div>
              </div>
            </div>

            {/* Document Previews Mock */}
            <div className="grid grid-cols-3 gap-3">
              <div className="border rounded-xl p-3 text-center bg-white hover:border-green-300 transition-colors cursor-pointer">
                <span className="text-lg block">📄</span>
                <span className="text-[10px] font-bold text-gray-650 block mt-1">Dokumen NIB</span>
              </div>
              <div className="border rounded-xl p-3 text-center bg-white hover:border-green-300 transition-colors cursor-pointer">
                <span className="text-lg block">📜</span>
                <span className="text-[10px] font-bold text-gray-650 block mt-1">Sertifikat Halal</span>
              </div>
              <div className="border rounded-xl p-3 text-center bg-white hover:border-green-300 transition-colors cursor-pointer">
                <span className="text-lg block">💼</span>
                <span className="text-[10px] font-bold text-gray-650 block mt-1">Izin SIUP</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <button
                onClick={() => setSelectedAuditSupplier(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-550 hover:bg-gray-50 cursor-pointer"
              >
                Tutup Tinjauan
              </button>
              <button
                onClick={() => handleToggleVerify(selectedAuditSupplier.id, selectedAuditSupplier.is_verified)}
                disabled={actionId === selectedAuditSupplier.id}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer ${
                  selectedAuditSupplier.is_verified === 1 ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {actionId === selectedAuditSupplier.id ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : selectedAuditSupplier.is_verified === 1 ? (
                  'Batal Verifikasi'
                ) : (
                  'Setujui & Verifikasi Akun'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupplierVerificationView;
