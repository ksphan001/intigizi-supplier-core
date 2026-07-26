import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../services/api';
import {
  Loader2,
  Search,
  CheckCircle2,
  AlertCircle,
  UserCog,
  ArrowUpDown,
  Filter
} from 'lucide-react';

function AllProductsView({ onNavigateToSupplier }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filters & Sorting states
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [selectedSort, setSelectedSort] = useState('name-asc');

  const [commissions, setCommissions] = useState({
    'Lauk Protein': 5,
    'Makanan Pokok': 2,
    'Sayuran & Lauk Nabati': 3,
    'Buah & Minuman': 4,
    'Lain-lain': 2
  });

  useEffect(() => {
    const saved = localStorage.getItem('platformCommissions');
    if (saved) {
      try {
        setCommissions(JSON.parse(saved));
      } catch (err) {
        console.error("Gagal membaca komisi", err);
      }
    }
  }, []);

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

  // Filter & Sort Logic
  const processedProducts = useMemo(() => {
    let list = [...products];

    // 1. Keyword search (Name or Supplier)
    if (search.trim() !== '') {
      const query = search.toLowerCase();
      list = list.filter(p => 
        p.ingredient_name.toLowerCase().includes(query) ||
        p.supplier_name.toLowerCase().includes(query)
      );
    }

    // 2. Category Filter
    if (selectedCategory !== 'Semua') {
      list = list.filter(p => getCategory(p.ingredient_name) === selectedCategory);
    }

    // 3. Status Filter
    if (selectedStatus !== 'Semua') {
      const targetActive = selectedStatus === 'Aktif' ? 1 : 0;
      list = list.filter(p => parseInt(p.is_active) === targetActive);
    }

    // 4. Sort
    list.sort((a, b) => {
      if (selectedSort === 'name-asc') {
        return a.ingredient_name.localeCompare(b.ingredient_name);
      }
      if (selectedSort === 'price-asc') {
        return parseFloat(a.base_price) - parseFloat(b.base_price);
      }
      if (selectedSort === 'price-desc') {
        return parseFloat(b.base_price) - parseFloat(a.base_price);
      }
      if (selectedSort === 'capacity-desc') {
        return parseFloat(b.daily_capacity) - parseFloat(a.daily_capacity);
      }
      return 0;
    });

    return list;
  }, [products, search, selectedCategory, selectedStatus, selectedSort]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Modern Filter Dashboard Controls */}
      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-150 flex flex-wrap gap-4 items-end shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cari Bahan / Supplier</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Cari kata kunci..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-style w-full pl-9 h-[38px] mt-0 text-xs py-1"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          </div>
        </div>

        <div className="w-[180px]">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Kategori</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-style w-full h-[38px] mt-0 text-xs py-1"
          >
            <option value="Semua">Semua Kategori</option>
            <option value="Lauk Protein">Lauk Protein</option>
            <option value="Makanan Pokok">Makanan Pokok</option>
            <option value="Sayuran & Lauk Nabati">Sayuran & Lauk Nabati</option>
            <option value="Buah & Minuman">Buah & Minuman</option>
            <option value="Lain-lain">Lain-lain</option>
          </select>
        </div>

        <div className="w-[150px]">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status Keaktifan</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input-style w-full h-[38px] mt-0 text-xs py-1"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif / Publik</option>
            <option value="Ditangguhkan">Ditangguhkan</option>
          </select>
        </div>

        <div className="w-[180px]">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Urutan Data</label>
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="input-style w-full h-[38px] mt-0 text-xs py-1"
          >
            <option value="name-asc">Nama Bahan Baku (A-Z)</option>
            <option value="price-asc">Harga Dasar Terendah</option>
            <option value="price-desc">Harga Dasar Tertinggi</option>
            <option value="capacity-desc">Kapasitas Harian Terbesar</option>
          </select>
        </div>

        <button
          onClick={fetchProducts}
          className="text-xs font-bold text-green-600 hover:text-green-800 transition-colors bg-green-50 px-3 py-2 rounded-xl border border-green-200 cursor-pointer h-[38px]"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={32} /></div>
      ) : processedProducts.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center text-gray-400 italic">
          Tidak ada produk yang cocok dengan kriteria filter.
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
                <th className="px-6 py-4 text-center">Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {processedProducts.map((item) => {
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
                      {formatCurrency(item.base_price)} / {item.unit_symbol}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-emerald-700">
                      <span>{formatCurrency(commissionVal)}</span>
                      <span className="text-[10px] text-gray-400 font-bold block">({rate}% Fee | Net: {formatCurrency(netVal)})</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {parseFloat(item.daily_capacity).toLocaleString('id-ID')} {item.unit_symbol} / hari
                    </td>
                    <td className="px-6 py-4">
                      {parseInt(item.is_active) === 1 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                          <CheckCircle2 size={12} /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                          <AlertCircle size={12} /> Ditangguhkan
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => onNavigateToSupplier(item.supplier_name)}
                        title="Kelola Supplier"
                        className="inline-flex items-center justify-center p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 border border-green-100 transition-all cursor-pointer shadow-sm hover:-translate-y-0.5"
                      >
                        <UserCog size={16} />
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
