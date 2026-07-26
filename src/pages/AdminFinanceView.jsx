import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { DollarSign, Percent, ArrowUpRight, Calendar, Filter, FileText, Loader2, Download, Search } from 'lucide-react';

function AdminFinanceView() {
  const [data, setData] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    supplier_id: '',
    start_date: '',
    end_date: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFinancials = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.supplier_id) queryParams.append('supplier_id', filters.supplier_id);
      if (filters.start_date) queryParams.append('start_date', filters.start_date);
      if (filters.end_date) queryParams.append('end_date', filters.end_date);

      const [resFinance, resSuppliers] = await Promise.all([
        apiClient.get(`/admin_finance.php?${queryParams.toString()}`),
        apiClient.get('/admin_suppliers.php')
      ]);

      setData(resFinance.data);
      setSuppliers(Array.isArray(resSuppliers.data) ? resSuppliers.data : []);
    } catch (err) {
      console.error('Gagal memuat laporan keuangan', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      supplier_id: '',
      start_date: '',
      end_date: ''
    });
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val || 0);
  };

  // Export to CSV Function
  const handleExportCSV = () => {
    if (!data || !data.transactions || data.transactions.length === 0) return;

    const headers = ['PO Code', 'Tanggal', 'Supplier', 'Dapur Gizi', 'Status', 'Nominal Kotor (GMV)', 'Fee Platform', 'Bersih Supplier'];
    const rows = data.transactions.map(t => [
      t.po_code,
      new Date(t.created_at).toLocaleDateString('id-ID'),
      t.supplier_name,
      t.kitchen_name,
      t.status,
      t.gross_amount,
      t.platform_fee,
      t.net_amount
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_keuangan_b2b_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = data?.transactions?.filter(t => 
    t.po_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.kitchen_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* FILTER CONTROL BAR */}
      <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Filter size={12} />
              <span>Supplier</span>
            </label>
            <select
              name="supplier_id"
              value={filters.supplier_id}
              onChange={handleFilterChange}
              className="input-style w-full bg-white text-xs"
            >
              <option value="">-- Semua Supplier --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.supplier_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Calendar size={12} />
              <span>Dari Tanggal</span>
            </label>
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="input-style w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Calendar size={12} />
              <span>Sampai Tanggal</span>
            </label>
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="input-style w-full text-xs"
            />
          </div>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Reset Filter
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!data?.transactions?.length}
            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Download size={14} />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-green-600" size={32} />
        </div>
      ) : (
        <>
          {/* STATS CARDS SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Gross GMV (Omzet)</p>
                <p className="text-xl font-black text-gray-800 mt-0.5">{formatCurrency(data?.summary?.total_gmv)}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Percent size={24} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Fee Platform</p>
                <p className="text-xl font-black text-purple-700 mt-0.5">{formatCurrency(data?.summary?.total_platform_fee)}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ArrowUpRight size={24} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Bersih Supplier</p>
                <p className="text-xl font-black text-blue-700 mt-0.5">{formatCurrency(data?.summary?.total_net_payout)}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-55 text-gray-500 flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Transaksi</p>
                <p className="text-xl font-black text-gray-800 mt-0.5">{data?.summary?.total_orders} Pesanan</p>
              </div>
            </div>
          </div>

          {/* CATEGORY RECAP & GENERAL BREAKDOWN */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category breakdown card */}
            <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-4 lg:col-span-1">
              <h4 className="text-sm font-bold text-gray-800">Sumbangan Komisi Kategori</h4>
              <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">Persentase total pendapatan platform fee yang bersumber dari masing-masing kategori pangan B2B.</p>
              <div className="space-y-3 pt-2">
                {data?.categories?.map((cat) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-gray-650">{cat.name} ({cat.pct}%)</span>
                      <span className="font-black text-purple-700">{formatCurrency(cat.value)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div 
                        className="bg-purple-650 h-1.5 rounded-full" 
                        style={{ width: `${data?.summary?.total_platform_fee > 0 ? (cat.value / data.summary.total_platform_fee) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Transaction List */}
            <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                <h4 className="text-sm font-bold text-gray-800">Rincian Transaksi Invoice PO</h4>
                
                <div className="relative max-w-xs w-full">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari PO, Supplier, Dapur..."
                    className="input-style w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50/50"
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-xs text-left text-gray-500">
                  <thead className="text-[10px] text-gray-700 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3">PO Code</th>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Supplier</th>
                      <th className="px-4 py-3">Dapur Gizi</th>
                      <th className="px-4 py-3 text-right">Nominal Kotor</th>
                      <th className="px-4 py-3 text-right">Fee Platform</th>
                      <th className="px-4 py-3 text-right">Bersih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTransactions.map((t) => (
                      <tr key={t.order_id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-mono font-bold text-green-700">{t.po_code}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(t.created_at).toLocaleDateString('id-ID', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-700 truncate max-w-[120px]">{t.supplier_name}</td>
                        <td className="px-4 py-3 font-medium text-gray-650 truncate max-w-[120px]">{t.kitchen_name}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(t.gross_amount)}</td>
                        <td className="px-4 py-3 text-right font-bold text-purple-700">{formatCurrency(t.platform_fee)}</td>
                        <td className="px-4 py-3 text-right font-black text-emerald-600">{formatCurrency(t.net_amount)}</td>
                      </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-gray-400 italic">Tidak ada transaksi ditemukan.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminFinanceView;
