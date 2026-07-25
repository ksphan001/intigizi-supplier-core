import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Loader2, Search, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

function AllProductsView() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState(null);
  const [message, setMessage] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin_products.php');
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Gagal memuat katalog global", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleProduct = async (id, currentStatus) => {
    setActionId(id);
    setMessage('');
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      await apiClient.put('/admin_products.php', { id, is_active: newStatus });
      setMessage('Status keaktifan produk berhasil diperbarui!');
      fetchProducts();
    } catch (err) {
      setMessage('Gagal memperbarui status produk.');
    } finally {
      setActionId(null);
    }
  };

  const filteredProducts = products.filter(p => 
    p.ingredient_name.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier_name.toLowerCase().includes(search.toLowerCase())
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
            placeholder="Cari bahan makanan atau nama supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-style w-full pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        </div>
        <button
          onClick={fetchProducts}
          className="text-xs font-bold text-green-600 hover:text-green-800 transition-colors bg-green-50 px-3 py-2 rounded-xl border border-green-200"
        >
          Penyegaran Data
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={32} /></div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center text-gray-400 italic">
          Tidak ada produk terdaftar di katalog.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-150 rounded-2xl">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4">Bahan Baku</th>
                <th className="px-6 py-4">Supplier / Pemasok</th>
                <th className="px-6 py-4">Harga Dasar</th>
                <th className="px-6 py-4">Kapasitas Harian</th>
                <th className="px-6 py-4">Status Layanan</th>
                <th className="px-6 py-4 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-800">{item.ingredient_name}</td>
                  <td className="px-6 py-4 text-gray-700 font-semibold">{item.supplier_name}</td>
                  <td className="px-6 py-4 text-gray-900 font-bold">
                    Rp {parseFloat(item.base_price).toLocaleString('id-ID')} / {item.unit_symbol}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {parseFloat(item.daily_capacity).toLocaleString('id-ID')} {item.unit_symbol} / hari
                  </td>
                  <td className="px-6 py-4">
                    {item.is_active === 1 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle2 size={12} /> Aktif / Publik
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                        <AlertCircle size={12} /> Ditangguhkan
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleToggleProduct(item.id, item.is_active)}
                      disabled={actionId === item.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        item.is_active === 1
                          ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {actionId === item.id ? (
                        <Loader2 className="animate-spin" size={12} />
                      ) : item.is_active === 1 ? (
                        'Tangguhkan'
                      ) : (
                        'Aktifkan'
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

export default AllProductsView;
