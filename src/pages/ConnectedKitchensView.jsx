import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Loader2, Search, Link2, Calendar } from 'lucide-react';

function ConnectedKitchensView() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin_connections.php');
      setConnections(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Gagal memuat log koneksi dapur", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const filteredConnections = connections.filter(c => 
    c.kitchen_name.toLowerCase().includes(search.toLowerCase()) ||
    c.supplier_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Cari nama dapur atau supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-style w-full pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        </div>
        <button
          onClick={fetchConnections}
          className="text-xs font-bold text-green-600 hover:text-green-800 transition-colors bg-green-50 px-3 py-2 rounded-xl border border-green-200"
        >
          Penyegaran Data
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={32} /></div>
      ) : filteredConnections.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center text-gray-400 italic">
          Belum ada Dapur IntiGizi yang terhubung dengan Supplier di Marketplace.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-150 rounded-2xl">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4">Nama Unit Dapur (Kitchen Instance)</th>
                <th className="px-6 py-4">Hubungan Terkoneksi</th>
                <th className="px-6 py-4">Supplier yang Dihubungkan</th>
                <th className="px-6 py-4">Waktu Sinkronisasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredConnections.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-800">{item.kitchen_name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <Link2 size={12} /> Connected
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-700">{item.supplier_name}</p>
                    <p className="text-xs text-gray-400">PIC: {item.contact_person}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-medium">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calendar size={14} className="text-gray-400" />
                      <span>{new Date(item.connected_at).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}</span>
                    </div>
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

export default ConnectedKitchensView;
