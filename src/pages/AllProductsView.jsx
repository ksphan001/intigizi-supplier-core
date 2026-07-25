import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Loader2, Search, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

import { useMemo } from 'react';

function AllProductsView() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [actionId, setActionId] = useState(null);
  const [message, setMessage] = useState('');
  const [commissions, setCommissions] = useState({
    'Lauk Protein': 5,
    'Makanan Pokok': 2,
    'Sayuran & Lauk Nabati': 3,
    'Buah & Minuman': 4,
    'Lain-lain': 2
  });

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

  const getCategory = (name) => {
    const lowercase = name.toLowerCase();
    if (lowercase.includes('daging') || lowercase.includes('ayam') || lowercase.includes('bebek') || lowercase.includes('telur') || lowercase.includes('kambing') || lowercase.includes('ati') || lowercase.includes('puyuh') || lowercase.includes('ikan') || lowercase.includes('susu')) {
      return 'Lauk Protein';
    }
    if (lowercase.includes('beras') || lowercase.includes('kentang') || lowercase.includes('oat') || lowercase.includes('tepung')) {
      return 'Makanan Pokok';
    }
    if (lowercase.includes('wortel') || lowercase.includes('bayam') || lowercase.includes('bumbu') || lowercase.includes('tempe') || lowercase.includes('tahu') || lowercase.includes('sayur') || lowercase.includes('bawang') || lowercase.includes('cabe')) {
      return 'Sayuran & Lauk Nabati';
    }
    if (lowercase.includes('pisang') || lowercase.includes('melon') || lowercase.includes('air') || lowercase.includes('jus') || lowercase.includes('buah')) {
      return 'Buah & Minuman';
    }
    return 'Lain-lain';
  };

  const handleToggleProduct = async (id, currentStatus) => {
    setActionId(id);
    setMessage('');
    const newStatus = parseInt(currentStatus) === 1 ? 0 : 1;
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

  const uniqueSuppliers = useMemo(() => {
    return Array.from(new Set(products.map(p => p.supplier_name))).sort();
  }, [products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.ingredient_name.toLowerCase().includes(search.toLowerCase()) ||
                          p.supplier_name.toLowerCase().includes(search.toLowerCase());
    const matchesSupplier = !selectedSupplier || p.supplier_name === selectedSupplier;
    const matchesStatus = !selectedStatus || 
                          (selectedStatus === '1' && parseInt(p.is_active) === 1) || 
                          (selectedStatus === '0' && parseInt(p.is_active) === 0);
    const matchesCategory = !selectedCategory || getCategory(p.ingredient_name) === selectedCategory;
    return matchesSearch && matchesSupplier && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold border ${message.includes('Gagal') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Commission settings panel */}
      <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <h4 className="font-extrabold text-gray-800 text-sm">⚙️ Pengaturan Komisi Transaksi Platform</h4>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">Potongan Komisi Superadmin B2B Marketplace</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.keys(commissions).map((cat) => (
            <div key={cat} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">{cat}</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={commissions[cat]}
                  onChange={(e) => setCommissions(prev => ({ ...prev, [cat]: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-855 p-1 text-center"
                />
                <span className="text-xs text-gray-400 font-bold">%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-150 flex flex-wrap gap-4 items-end shadow-sm">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cari Kata Kunci</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Cari bahan makanan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-style w-full pl-9 h-[38px] mt-0 text-xs py-1"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          </div>
        </div>

        <div className="w-48">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Filter Kategori</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-style bg-white h-[38px] mt-0 text-xs py-1 px-2.5 font-semibold"
          >
            <option value="">-- Semua Kategori --</option>
            <option value="Makanan Pokok">Makanan Pokok</option>
            <option value="Lauk Protein">Lauk Protein</option>
            <option value="Sayuran & Lauk Nabati">Sayuran & Lauk Nabati</option>
            <option value="Buah & Minuman">Buah & Minuman</option>
            <option value="Lain-lain">Lain-lain</option>
          </select>
        </div>

        <div className="w-56">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Filter Pemasok</label>
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="input-style bg-white h-[38px] mt-0 text-xs py-1 px-2.5 font-semibold"
          >
            <option value="">-- Semua Supplier --</option>
            {uniqueSuppliers.map(sup => (
              <option key={sup} value={sup}>{sup}</option>
            ))}
          </select>
        </div>

        <div className="w-44">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status Layanan</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input-style bg-white h-[38px] mt-0 text-xs py-1 px-2.5 font-semibold"
          >
            <option value="">-- Semua Status --</option>
            <option value="1">Aktif / Publik</option>
            <option value="0">Ditangguhkan</option>
          </select>
        </div>

        <button
          onClick={() => {
            setSearch('');
            setSelectedSupplier('');
            setSelectedStatus('');
            setSelectedCategory('');
            fetchProducts();
          }}
          className="h-[38px] px-4 bg-white hover:bg-gray-100 text-gray-700 font-bold border border-gray-250 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm"
        >
          Reset Filter
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
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Supplier / Pemasok</th>
                <th className="px-6 py-4">Harga Dasar</th>
                <th className="px-6 py-4">Komisi Platform</th>
                <th className="px-6 py-4">Kapasitas Harian</th>
                <th className="px-6 py-4">Status Layanan</th>
                <th className="px-6 py-4 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((item) => {
                const cat = getCategory(item.ingredient_name);
                const rate = commissions[cat] || 0;
                const commissionVal = (parseFloat(item.base_price) * rate) / 100;
                const netVal = parseFloat(item.base_price) - commissionVal;

                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800">{item.ingredient_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                        cat === 'Lauk Protein' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                        cat === 'Makanan Pokok' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        cat === 'Sayuran & Lauk Nabati' ? 'bg-green-50 text-green-700 border border-green-100' :
                        cat === 'Buah & Minuman' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                        'bg-gray-50 text-gray-700 border border-gray-100'
                      }`}>
                        {cat}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-semibold">{item.supplier_name}</td>
                    <td className="px-6 py-4 text-gray-900 font-bold">
                      Rp {parseFloat(item.base_price).toLocaleString('id-ID')} / {item.unit_symbol}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-emerald-700">
                      <span>Rp {commissionVal.toLocaleString('id-ID')}</span>
                      <span className="text-[10px] text-gray-400 font-bold block">({rate}% Fee | Net: Rp {netVal.toLocaleString('id-ID')})</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {parseFloat(item.daily_capacity).toLocaleString('id-ID')} {item.unit_symbol} / hari
                    </td>
                    <td className="px-6 py-4">
                      {parseInt(item.is_active) === 1 ? (
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          parseInt(item.is_active) === 1
                            ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {actionId === item.id ? (
                          <Loader2 className="animate-spin" size={12} />
                        ) : parseInt(item.is_active) === 1 ? (
                          'Tangguhkan'
                        ) : (
                          'Aktifkan'
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AllProductsView;
