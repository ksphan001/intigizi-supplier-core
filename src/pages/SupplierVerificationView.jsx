import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Loader2, CheckCircle2, XCircle, Search, ShieldCheck, ShieldAlert, ExternalLink } from 'lucide-react';

function SupplierVerificationView() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState(null);
  const [message, setMessage] = useState('');

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
                  <td className="px-6 py-4 text-right flex justify-end">
                    <button
                      onClick={() => handleToggleVerify(item.id, item.is_verified)}
                      disabled={actionId === item.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
    </div>
  );
}

export default SupplierVerificationView;
