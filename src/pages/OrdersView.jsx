import React, { useState } from 'react';
import { Inbox, CheckCircle2, Truck, Timer, ClipboardList } from 'lucide-react';

function OrdersView() {
  // Mock data for B2B Marketplace orders
  const [orders, setOrders] = useState([
    {
      id: 'PO-2026-0001',
      kitchen_name: 'Dapur Satgas Gizi Sukadamai',
      date: '2026-07-25',
      items: [
        { name: 'Beras Giling', qty: 100, unit: 'kg', price: 12500 },
        { name: 'Telur Ayam Segar', qty: 300, unit: 'butir', price: 1800 }
      ],
      total_amount: 1790000,
      address: 'Jl. Merdeka No. 45, Cihampelas, Kab. Bandung Barat',
      status: 'pending' // pending, processing, shipped, delivered
    },
    {
      id: 'PO-2026-0002',
      kitchen_name: 'Dapur Satgas Gizi Cihampelas',
      date: '2026-07-24',
      items: [
        { name: 'Daging Sapi Sirloin', qty: 25, unit: 'kg', price: 110000 },
        { name: 'Wortel Segar', qty: 40, unit: 'kg', price: 14000 }
      ],
      total_amount: 3310000,
      address: 'Komp. Dapur Sehat Blok C2, Cihampelas',
      status: 'shipped'
    }
  ]);

  const handleUpdateStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Daftar Pesanan Masuk (B2B)</h3>
        <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Total: {orders.length} Order</span>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border rounded-2xl p-16 text-center">
          <Inbox size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400 italic">Belum ada pesanan masuk dari unit dapur.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-4 gap-2">
                <div>
                  <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <span>{order.id}</span>
                    {getStatusBadge(order.status)}
                  </h4>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">Dapur: <span className="text-gray-700 font-bold">{order.kitchen_name}</span> | Tgl: {order.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-bold uppercase">Total Tagihan</p>
                  <p className="text-xl font-extrabold text-green-700">{formatCurrency(order.total_amount)}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Item Belanja</p>
                <div className="divide-y divide-gray-200/50">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="py-1.5 flex justify-between text-xs">
                      <span className="font-semibold text-gray-700">{item.name}</span>
                      <span className="text-gray-500 font-medium">
                        {item.qty} {item.unit} x {formatCurrency(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="text-xs text-gray-600 mb-6">
                <span className="font-bold text-gray-700">Alamat Pengiriman Dapur: </span>
                <span>{order.address}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t pt-4">
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'processing')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Terima & Proses Pesanan
                  </button>
                )}
                {order.status === 'processing' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'shipped')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Kirim Pesanan
                  </button>
                )}
                {order.status === 'shipped' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'delivered')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Selesaikan Pesanan
                  </button>
                )}
                {order.status === 'delivered' && (
                  <span className="text-xs font-bold text-gray-400 italic">Pesanan selesai diantar</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrdersView;
