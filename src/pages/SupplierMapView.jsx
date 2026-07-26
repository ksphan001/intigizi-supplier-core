import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, MapPin, Search, Filter } from 'lucide-react';

import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function SupplierMapView() {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering states
  const [selectedIngredient, setSelectedIngredient] = useState('Semua');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [resSuppliers, resProducts] = await Promise.all([
          apiClient.get('/admin_suppliers.php'),
          apiClient.get('/admin_products.php')
        ]);
        setSuppliers(Array.isArray(resSuppliers.data) ? resSuppliers.data : []);
        setProducts(Array.isArray(resProducts.data) ? resProducts.data : []);
      } catch (err) {
        console.error("Gagal memuat data peta sebaran", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Unique list of ingredients for the dropdown
  const uniqueIngredients = useMemo(() => {
    const list = new Set();
    products.forEach(p => {
      if (p.ingredient_name) {
        list.add(p.ingredient_name);
      }
    });
    return Array.from(list).sort();
  }, [products]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (loading || !mapContainerRef.current) return;

    // Jakarta default coordinates
    const map = L.map(mapContainerRef.current).setView([-6.175392, 106.827153], 11);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Layer group for dynamic markers
    const layers = L.layerGroup().addTo(map);
    layerGroupRef.current = layers;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading]);

  // Draw markers and circles on filter changes
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    // Clear old layers
    layerGroupRef.current.clearLayers();

    // Determine which suppliers to show based on selected ingredient
    const suppliersToShow = suppliers.filter(s => {
      const lat = parseFloat(s.latitude);
      const lng = parseFloat(s.longitude);
      if (isNaN(lat) || isNaN(lng)) return false;

      if (selectedIngredient === 'Semua') return true;

      // Check if this supplier sells the selected ingredient
      return products.some(p => p.supplier_name === s.supplier_name && p.ingredient_name === selectedIngredient);
    });

    const bounds = [];

    suppliersToShow.forEach(s => {
      const lat = parseFloat(s.latitude);
      const lng = parseFloat(s.longitude);
      const radiusKm = parseFloat(s.coverage_radius_km || 15);

      // List of products of this supplier
      const itemsSupplied = products
        .filter(p => p.supplier_name === s.supplier_name)
        .map(p => p.ingredient_name)
        .join(', ');

      const popupContent = `
        <div class="p-2 space-y-1.5 min-w-[200px]">
          <h4 class="font-extrabold text-xs text-gray-800">${s.supplier_name}</h4>
          <p class="text-[10px] text-gray-500 font-semibold"><span class="font-bold">📍 Radius Layanan:</span> ${radiusKm} km</p>
          <p class="text-[10px] text-gray-500 font-semibold"><span class="font-bold">📞 Kontak:</span> ${s.phone_number || '-'}</p>
          <div class="border-t pt-1.5 mt-1.5">
            <span class="text-[9px] font-bold text-gray-400 block uppercase">Komoditas Tersedia:</span>
            <p class="text-[10px] text-gray-600 mt-0.5 max-h-16 overflow-y-auto font-medium">${itemsSupplied || 'Belum mengunggah produk'}</p>
          </div>
        </div>
      `;

      // Marker
      const marker = L.marker([lat, lng]).bindPopup(popupContent);
      layerGroupRef.current.addLayer(marker);

      // Coverage Circle
      const circle = L.circle([lat, lng], {
        color: '#10B981',
        fillColor: '#10B981',
        fillOpacity: 0.1,
        weight: 1.5,
        radius: radiusKm * 1000
      });
      layerGroupRef.current.addLayer(circle);

      bounds.push([lat, lng]);
    });

    // Auto fit bounds to see all matching suppliers
    if (bounds.length > 0 && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [selectedIngredient, suppliers, products]);

  // Helper utility for useMemo
  function useMemo(factory, deps) {
    return React.useMemo(factory, deps);
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-150 flex flex-wrap gap-4 items-end shadow-sm">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Filter size={12} />
            <span>Saring Berdasarkan Pasokan Bahan Makanan</span>
          </label>
          <select
            value={selectedIngredient}
            onChange={(e) => setSelectedIngredient(e.target.value)}
            className="input-style w-full h-[38px] mt-0 text-xs py-1"
          >
            <option value="Semua">Semua Bahan Baku (Tampilkan Semua Supplier)</option>
            {uniqueIngredients.map(ing => (
              <option key={ing} value={ing}>{ing}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-gray-400 font-bold bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block animate-pulse" />
          <span>Lingkaran Hijau melambangkan jangkauan radius pengiriman supplier</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={32} /></div>
      ) : (
        <div className="relative border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
          <div ref={mapContainerRef} className="h-[550px] w-full z-10" />
        </div>
      )}
    </div>
  );
}

export default SupplierMapView;
