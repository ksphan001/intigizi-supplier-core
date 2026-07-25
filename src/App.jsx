import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import CSS
import './index.css';

import Login from './pages/Login';
import Register from './pages/Register';
import CatalogView from './pages/CatalogView';
import OrdersView from './pages/OrdersView';
import ProfileView from './pages/ProfileView';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('katalog');

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'katalog':
        return 'Manajemen Katalog Bahan Baku';
      case 'orders':
        return 'Pesanan Masuk (B2B)';
      case 'profile':
        return 'Profil & Lokasi GPS Toko';
      default:
        return 'Portal B2B Supplier';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 p-6 flex-shrink-0">
        <h1 className="text-xl font-bold text-green-750 mb-8 flex items-center gap-2">
          <span className="text-green-700">Supplier Portal</span>
          <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full uppercase">B2B</span>
        </h1>
        <nav className="space-y-1">
          <button
            onClick={() => setActiveTab('katalog')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'katalog'
                ? 'bg-green-50 text-green-700 border border-green-200/50 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Katalog Saya
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-green-50 text-green-700 border border-green-200/50 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Pesanan Masuk
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-green-50 text-green-700 border border-green-200/50 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Profil Toko
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">{getHeaderTitle()}</h2>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="text-sm font-semibold text-red-650 hover:text-red-800 transition-colors"
          >
            Keluar
          </button>
        </header>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          {activeTab === 'katalog' && <CatalogView />}
          {activeTab === 'orders' && <OrdersView />}
          {activeTab === 'profile' && <ProfileView />}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
