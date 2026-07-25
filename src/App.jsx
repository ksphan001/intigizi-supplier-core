import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import CSS
import './index.css';

import Login from './pages/Login';
import Register from './pages/Register';

function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 p-6 flex-shrink-0">
        <h1 className="text-xl font-bold text-green-700 mb-8 flex items-center gap-2">
          <span>Supplier Portal</span>
          <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full uppercase">B2B</span>
        </h1>
        <nav className="space-y-2">
          <a href="#katalog" className="block px-4 py-2 bg-green-50 text-green-700 font-semibold rounded-lg text-sm">Katalog Saya</a>
          <a href="#orders" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm transition-colors">Pesanan Masuk</a>
          <a href="#profile" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm transition-colors">Profil Toko</a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Katalog Bahan Baku</h2>
          <button onClick={() => window.location.href = '/login'} className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors">
            Keluar
          </button>
        </header>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 italic">Selamat datang di portal supplier! Mulai atur dan kelola inventaris, harga dasar, serta koordinat lokasi pengiriman Anda.</p>
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
