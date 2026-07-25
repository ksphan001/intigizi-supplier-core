import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Loader2, TrendingUp, DollarSign, ShoppingBag, Truck, Calendar } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';

function SupplierDashboardView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await apiClient.get('/supplier_dashboard_analytics.php');
        setData(response.data);
      } catch (err) {
        console.error("Gagal memuat data dasbor", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="animate-spin text-green-600" size={32} />
      </div>
    );
  }

  // Fallback data jika backend masih kosong
  const chartData = data?.monthly_revenue?.length > 0 
    ? data.monthly_revenue 
    : [
        { month_name: 'Mei', amount: 4500000 },
        { month_name: 'Juni', amount: 8200000 },
        { month_name: 'Juli', amount: data?.total_revenue || 12000000 }
      ];

  const topSelling = data?.top_selling?.length > 0
    ? data.top_selling
    : [
        { name: 'Beras Giling Premium', total_qty: 320, unit: 'kg' },
        { name: 'Telur Ayam Segar', total_qty: 1500, unit: 'butir' },
        { name: 'Daging Ayam Broiler', total_qty: 120, unit: 'kg' }
      ];

  return (
    <div className="space-y-8">
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Omzet Pendapatan</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{formatCurrency(data?.total_revenue)}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingBag size={28} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Pesanan Diproses</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{data?.total_orders || 0} Order</p>
          </div>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Truck size={28} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Order Pengiriman Aktif</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{data?.active_orders || 0} Dapur</p>
          </div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Omzet Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-150 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="font-extrabold text-gray-800 text-sm">Tren Pendapatan Bulanan</h4>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Penjualan B2B Dapur Gizi</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl">
              <TrendingUp size={14} />
              <span>Omzet Tumbuh</span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month_name" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm">
          <h4 className="font-extrabold text-gray-800 text-sm mb-6">Bahan Gizi Terlaris</h4>
          <div className="space-y-4">
            {topSelling.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center pb-3 border-b last:border-0 last:pb-0">
                <div>
                  <p className="font-bold text-gray-850 text-xs">{item.name}</p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Produk Bahan Baku</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-green-50 text-green-700 font-black text-xs rounded-xl border border-green-150">
                    {item.total_qty} {item.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupplierDashboardView;
