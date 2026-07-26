import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { DollarSign, Percent, ArrowUpRight, Calendar, Filter, FileText, Loader2, Download, Search } from 'lucide-react';

function SupplierFinanceView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFinancials = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.start_date) queryParams.append('start_date', filters.start_date);
      if (filters.end_date) queryParams.append('end_date', filters.end_date);

      const response = await apiClient.get(`/supplier_finance.php?${queryParams.toString()}`);
      setData(response.data);
    } catch (err) {
      console.error('Gagal memuat laporan keuangan supplier', err);
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

  const handleExportCSV = () => {
    if (!data || !data.transactions || data.transactions.length === 0) return;

    const headers = ['PO Code', 'Tanggal', 'Dapur Gizi', 'Status', 'Gross Sales (GMV)', 'Fee Platform (Admin)', 'Bersih Supplier'];
    const rows = data.transactions.map(t => [
      t.po_code,
      new Date(t.created_at).toLocaleDateString('id-ID'),
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
    link.setAttribute("download", `laporan_penjualan_supplier_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = data?.transactions?.filter(t => 
    t.po_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.kitchen_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* FILTER CONTROL BAR */}
      <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-4">
          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tanggal Mulai</label>
            <div className="relative">
              <input 
                type="date" 
                name="start_date"
                value={filters.start_date}
                onChange={handleFilterChange}
                className="input-style py-2 px-3 text-xs w-40 text-gray-600 font-semibold"
              />
            </div>
          </div>
          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tanggal Akhir</label>
            <div className="relative">
              <input 
                type="date" 
                name="end_date"
                value={filters.end_date}
                onChange={handleFilterChange}
                className="input-style py-2 px-3 text-xs w-40 text-gray-600 font-semibold"
              />
            </div>
          </div>

          <button 
            onClick={handleResetFilters}
            className="btn-secondary py-2.5 px-4 text-xs font-bold mt-5 cursor-pointer"
          >
            Reset
          </button>
        </div>

        <button 
          onClick={handleExportCSV}
          className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-green-600/20"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="animate-spin text-green-600" size={32} />
        </div>
      ) : (
        <>
          {/* FINANCE KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Gross Sales */}
            <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between z-10 relative">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gross Sales (GMV)</span>
                  <h3 className="text-2xl font-black text-gray-800 mt-1">{formatCurrency(data?.summary?.total_gmv)}</h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-1">Total nilai kotor seluruh orderan sukses</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                  <DollarSign size={20} />
                </div>
              </div>
            </div>

            {/* Card 2: Platform Fee (Admin Fee) */}
            <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between z-10 relative">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-rose-500">Fee Platform (Admin Marketplace)</span>
                  <h3 className="text-2xl font-black text-rose-600 mt-1">{formatCurrency(data?.summary?.total_platform_fee)}</h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-1">Potongan fee layanan yang disetorkan ke admin</p>
                </div>
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Percent size={20} />
                </div>
              </div>
            </div>

            {/* Card 3: Net Revenue */}
            <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between z-10 relative">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-blue-500">Pendapatan Bersih Supplier</span>
                  <h3 className="text-2xl font-black text-blue-600 mt-1">{formatCurrency(data?.summary?.total_net_payout)}</h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-1">Nominal bersih yang diterima oleh supplier</p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                  <ArrowUpRight size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* DETAILED TRANSACTIONS LIST */}
          <div className="bg-white border border-gray-150 rounded-2xl shadow-sm">
            <div className="p-6 border-b border-gray-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-gray-800">Rincian Penjualan & Tagihan</h4>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Daftar transaksi yang diselesaikan beserta pemotongan fee</p>
              </div>
              <div className="relative w-full md:w-80">
                <input 
                  type="text" 
                  placeholder="Cari PO Code atau Dapur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-style py-2 pl-9 pr-4 text-xs w-full font-semibold"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-[10px] text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-150">
                  <tr>
                    <th className="px-6 py-4">PO Code</th>
                    <th className="px-6 py-4">Tanggal Selesai</th>
                    <th className="px-6 py-4">Dapur Gizi (Mitra)</th>
                    <th className="px-6 py-4">Nominal Kotor (GMV)</th>
                    <th className="px-6 py-4 text-rose-500">Fee Admin (Platform)</th>
                    <th className="px-6 py-4 text-blue-600">Bersih Supplier</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-gray-400 italic font-semibold">
                        Tidak ada catatan penjualan yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t) => (
                      <tr key={t.order_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{t.po_code}</td>
                        <td className="px-6 py-4 text-gray-400 font-medium">
                          {new Date(t.created_at).toLocaleDateString('id-ID')} {new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-700">{t.kitchen_name}</td>
                        <td className="px-6 py-4 font-extrabold text-gray-700">{formatCurrency(t.gross_amount)}</td>
                        <td className="px-6 py-4 font-bold text-rose-500">
                          {formatCurrency(t.platform_fee)}
                          <span className="text-[10px] text-gray-400 font-semibold ml-1">({t.commission_source})</span>
                        </td>
                        <td className="px-6 py-4 font-extrabold text-blue-600">{formatCurrency(t.net_amount)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                            Selesai
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SupplierFinanceView;
