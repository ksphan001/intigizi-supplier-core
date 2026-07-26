import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../services/api';
import { Inbox, CheckCircle2, Truck, Timer, ClipboardList, Loader2, MapPin } from 'lucide-react';
import SupplierTrackingMap from '../components/SupplierTrackingMap.jsx';

function OrdersView() {
  const [orders, setOrders] = useState([]);
  const [supplierProfile, setSupplierProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'route'
  const [expandedOrders, setExpandedOrders] = useState({});

  const toggleExpandOrder = (id) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchOrders = useCallback(async () => {
    try {
      const response = await apiClient.get('/marketplace_orders.php');
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Gagal memuat pesanan", err);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await apiClient.get('/supplier_profile.php');
      setSupplierProfile(response.data);
    } catch (err) {
      console.error("Gagal memuat profil supplier", err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchOrders(), fetchProfile()]);
      setLoading(false);
    };
    loadData();
  }, [fetchOrders, fetchProfile]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setActionLoading(true);
    try {
      const response = await apiClient.post('/marketplace_orders.php', {
        action: 'update_status',
        order_id: orderId,
        status: newStatus
      });
      // Refresh orders
      await fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal memperbarui status pesanan.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><Timer size={12} className="mr-1" /> Pending</span>;
      case 'processing':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><ClipboardList size={12} className="mr-1" /> Diproses</span>;
      case 'shipped':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"><Truck size={12} className="mr-1" /> Dikirim</span>;
      case 'delivered':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200"><CheckCircle2 size={12} className="mr-1" /> Selesai</span>;
      default:
        return null;
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Titik koordinat gudang supplier
  const supplierCoords = useMemo(() => {
    if (supplierProfile?.latitude && supplierProfile?.longitude) {
      return {
        lat: parseFloat(supplierProfile.latitude),
        lng: parseFloat(supplierProfile.longitude)
      };
    }
    return null;
  }, [supplierProfile]);

  // Hitung jumlah order aktif yang belum selesai diantar
  const activeOrders = useMemo(() => {
    return orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status));
  }, [orders]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="animate-spin text-green-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-extrabold text-gray-800">Daftar Pesanan Masuk (B2B)</h3>
          <p className="text-xs text-gray-400 mt-1 font-semibold">Kelola pengadaan bahan makanan dapur mitra gizi secara profesional</p>
        </div>
        <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-bold uppercase border border-green-200">
          Total: {orders.length} Order
        </span>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-green-600 text-green-600 font-extrabold'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Daftar Pesanan ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('route')}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'route'
              ? 'border-green-600 text-green-600 font-extrabold'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Rute Pengantaran Kurir ({activeOrders.length})
        </button>
      </div>

      {activeTab === 'orders' ? (
        orders.length === 0 ? (
          <div className="bg-white border rounded-2xl p-16 text-center shadow-sm">
            <Inbox size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 italic font-semibold">Belum ada pesanan masuk dari unit dapur.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-2xl shadow-sm">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Kode PO</th>
                  <th className="px-6 py-4">Dapur</th>
                  <th className="px-6 py-4">Tanggal Masuk</th>
                  <th className="px-6 py-4">Total Tagihan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{order.po_code}</td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{order.kitchen_name}</td>
                      <td className="px-6 py-4 text-gray-400">{new Date(order.created_at).toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 font-bold text-green-700">{formatCurrency(order.total_amount)}</td>
                      <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleExpandOrder(order.id)}
                          className="btn-secondary py-1.5 px-3 text-xs"
                        >
                          {expandedOrders[order.id] ? 'Tutup Detail' : 'Lihat Detail'}
                        </button>
                      </td>
                    </tr>
                    {expandedOrders[order.id] && (
                      <tr className="bg-gray-50/50">
                        <td colSpan="6" className="px-8 py-6">
                          <div className="space-y-4 max-w-4xl">
                            {/* Items List */}
                            <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-inner">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Item Belanja</p>
                              <div className="divide-y divide-gray-100">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="py-2.5 flex justify-between text-sm">
                                    <span className="font-medium text-gray-700">{item.name}</span>
                                    <span className="text-gray-500 font-semibold">{item.qty} {item.unit} x {formatCurrency(item.price)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="text-xs text-gray-600 bg-emerald-50/30 p-3 rounded-xl border border-emerald-100/50">
                              <span className="font-bold text-gray-700">Alamat Pengiriman Dapur: </span>
                              <span>{order.kitchen_address || "-"}</span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-2 pt-2">
                              {order.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'processing')}
                                  disabled={actionLoading}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                >
                                  Terima & Proses Pesanan
                                </button>
                              )}
                              {order.status === 'processing' && (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'shipped')}
                                  disabled={actionLoading}
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                >
                                  Kirim Pesanan
                                </button>
                              )}
                              {order.status === 'shipped' && (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'delivered')}
                                  disabled={actionLoading}
                                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                >
                                  Selesaikan Pesanan
                                </button>
                              )}
                              {order.status === 'delivered' && (
                                <span className="text-xs font-bold text-gray-400 italic">Pesanan selesai diantar</span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* TAB 2: PETA NAVIGASI MULTI-DROP SUPPLIER */
        supplierCoords && activeOrders.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={14} className="text-emerald-500" />
                Peta Rute Distribusi Multi-Dapur Kurir
              </h4>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                {activeOrders.length} Dapur Penerima
              </span>
            </div>
            <div className="h-96 w-full rounded-2xl overflow-hidden border border-gray-200 relative shadow-inner">
              <SupplierTrackingMap supplierCoords={supplierCoords} orders={activeOrders} />
            </div>
          </div>
        ) : (
          <div className="bg-white border rounded-2xl p-16 text-center shadow-sm">
            <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 italic font-semibold">Tidak ada pengiriman aktif saat ini.</p>
          </div>
        )
      )}
    </div>
  );
}

export default OrdersView;
