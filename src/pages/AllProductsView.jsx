import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../services/api';
import {
  Loader2,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Store,
  ShieldCheck,
  Ban,
  Filter
} from 'lucide-react';

function AllProductsView() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Track which suppliers are expanded in the accordion
  const [expandedSuppliers, setExpandedSuppliers] = useState({});

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

  const handleToggleProduct = async (id, currentStatus) => {
    setActionLoading(true);
    setMessage('');
    const newStatus = parseInt(currentStatus) === 1 ? 0 : 1;
    try {
      await apiClient.put('/admin_products.php', { id, is_active: newStatus });
      setMessage('Status keaktifan produk berhasil diperbarui!');
      fetchProducts();
    } catch (err) {
      setMessage('Gagal memperbarui status produk.');
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Suspend/Activate all products of a supplier
  const handleBulkStatusChange = async (supplierName, targetStatus) => {
    const supplierProds = groupedSuppliers[supplierName]?.products || [];
    const ids = supplierProds.map(p => p.id);
    if (ids.length === 0) return;

    setActionLoading(true);
    setMessage('');
    try {
      await apiClient.put('/admin_products.php', { ids, is_active: targetStatus });
      setMessage(`Seluruh katalog produk ${supplierName} berhasil ${targetStatus === 1 ? 'diaktifkan' : 'ditangguhkan'}!`);
      fetchProducts();
    } catch (err) {
      setMessage('Gagal memproses perubahan massal.');
    } finally {
      setActionLoading(false);
    }
  };

  // Group products by supplier
  const groupedSuppliers = useMemo(() => {
    const groups = {};
    products.forEach(p => {
      if (!groups[p.supplier_name]) {
        groups[p.supplier_name] = {
          name: p.supplier_name,
          products: [],
          activeCount: 0,
          suspendedCount: 0
        };
      }
      
      const matchSearch = p.ingredient_name.toLowerCase().includes(search.toLowerCase());
      
      if (search === '' || matchSearch) {
        groups[p.supplier_name].products.push(p);
        if (parseInt(p.is_active) === 1) {
          groups[p.supplier_name].activeCount += 1;
        } else {
          groups[p.supplier_name].suspendedCount += 1;
        }
      }
    });

    // Remove suppliers with no matching products
    Object.keys(groups).forEach(key => {
      if (groups[key].products.length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }, [products, search]);

  // Auto-expand suppliers if there is an active search query
  useEffect(() => {
    if (search !== '') {
      const autoExpand = {};
      Object.keys(groupedSuppliers).forEach(key => {
        autoExpand[key] = true;
      });
      setExpandedSuppliers(autoExpand);
    }
  }, [search, groupedSuppliers]);

  const toggleExpand = (name) => {
    setExpandedSuppliers(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold border ${message.includes('Gagal') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Modern Filter Area */}
      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-150 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="flex-1 max-w-md">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cari Nama Bahan Makanan</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Cari cth: Telur, Beras, Daging..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-style w-full pl-9 h-[38px] mt-0 text-xs py-1"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          </div>
        </div>

        <button
          onClick={fetchProducts}
          className="text-xs font-bold text-green-600 hover:text-green-800 transition-colors bg-green-50 px-3 py-2 rounded-xl border border-green-200 cursor-pointer"
        >
          Segarkan Katalog
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={32} /></div>
      ) : Object.keys(groupedSuppliers).length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center text-gray-400 italic">
          Tidak ada produk yang cocok dengan pencarian Anda.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(groupedSuppliers).map((sup) => {
            const isExpanded = !!expandedSuppliers[sup.name];

            return (
              <div key={sup.name} className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Supplier Header Accordion */}
                <div
                  onClick={() => toggleExpand(sup.name)}
                  className="bg-gray-50/50 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                      <Store size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-gray-800 text-sm">{sup.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold">
                          {sup.activeCount} Aktif
                        </span>
                        {sup.suspendedCount > 0 && (
                          <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-bold">
                            {sup.suspendedCount} Ditangguhkan
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 font-semibold">• Total: {sup.products.length} Bahan</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                    {/* Bulk Action Buttons */}
                    <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 mr-2">
                      <button
                        onClick={() => handleBulkStatusChange(sup.name, 1)}
                        disabled={actionLoading}
                        className="px-2.5 py-1.5 bg-green-50 text-green-700 hover:bg-green-150 border border-green-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <CheckCircle2 size={12} />
                        <span>Aktifkan Semua</span>
                      </button>
                      <button
                        onClick={() => handleBulkStatusChange(sup.name, 0)}
                        disabled={actionLoading}
                        className="px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-150 border border-red-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Ban size={12} />
                        <span>Tangguhkan Semua</span>
                      </button>
                    </div>

                    <div className="text-gray-400">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {/* Supplier Product List Table */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-gray-500">
                      <thead className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50/20 border-b">
                        <tr>
                          <th className="px-6 py-3.5">Bahan Baku</th>
                          <th className="px-6 py-3.5">Kategori</th>
                          <th className="px-6 py-3.5">Harga Dasar</th>
                          <th className="px-6 py-3.5">Komisi Platform</th>
                          <th className="px-6 py-3.5">Kapasitas Harian</th>
                          <th className="px-6 py-3.5">Status Layanan</th>
                          <th className="px-6 py-3.5 text-right">Moderasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sup.products.map((item) => {
                          const cat = getCategory(item.ingredient_name);
                          const rate = commissions[cat] || 0;
                          const commissionVal = (parseFloat(item.base_price) * rate) / 100;
                          const netVal = parseFloat(item.base_price) - commissionVal;

                          return (
                            <tr key={item.id} className="hover:bg-gray-55/30 transition-colors">
                              <td className="px-6 py-3.5 font-bold text-gray-700">{item.ingredient_name}</td>
                              <td className="px-6 py-3.5">
                                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${
                                  cat === 'Lauk Protein' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                                  cat === 'Makanan Pokok' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                  cat === 'Sayuran & Lauk Nabati' ? 'bg-green-50 text-green-700 border border-green-100' :
                                  cat === 'Buah & Minuman' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                  'bg-gray-50 text-gray-700 border border-gray-100'
                                }`}>
                                  {cat}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 font-bold text-gray-900">
                                {formatCurrency(item.base_price)} / {item.unit_symbol}
                              </td>
                              <td className="px-6 py-3.5 font-semibold text-emerald-700">
                                <span>{formatCurrency(commissionVal)}</span>
                                <span className="text-[9px] text-gray-400 block font-normal">({rate}% Fee | Net: {formatCurrency(netVal)})</span>
                              </td>
                              <td className="px-6 py-3.5 text-gray-500 font-medium">
                                {parseFloat(item.daily_capacity).toLocaleString('id-ID')} {item.unit_symbol} / Hari
                              </td>
                              <td className="px-6 py-3.5">
                                {parseInt(item.is_active) === 1 ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                                    <CheckCircle2 size={10} /> Aktif / Publik
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                    <AlertCircle size={10} /> Ditangguhkan
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-3.5 text-right">
                                <button
                                  onClick={() => handleToggleProduct(item.id, item.is_active)}
                                  disabled={actionLoading}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                    parseInt(item.is_active) === 1
                                      ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                      : 'bg-green-600 text-white hover:bg-green-700'
                                  }`}
                                >
                                  {parseInt(item.is_active) === 1 ? 'Tangguhkan' : 'Aktifkan'}
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
          })}
        </div>
      )}
    </div>
  );
}

export default AllProductsView;
