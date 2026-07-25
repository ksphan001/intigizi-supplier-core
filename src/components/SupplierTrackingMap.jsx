import React, { useEffect, useCallback, useState, useMemo } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { Loader2 } from "lucide-react";

const GOOGLE_MAPS_LIBRARIES = ["places"];

const containerStyle = {
  width: "100%",
  height: "100%",
};
const defaultCenter = { lat: -6.2088, lng: 106.8456 };

function MapBounds({ supplierCoords, orders, map }) {
  useEffect(() => {
    if (map && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasPoints = false;

      // 1. Supplier Warehouse
      if (supplierCoords?.lat && supplierCoords?.lng) {
        bounds.extend(supplierCoords);
        hasPoints = true;
      }

      // 2. Kitchen Locations
      orders.forEach((ord) => {
        if (ord.kitchen_latitude && ord.kitchen_longitude) {
          bounds.extend({
            lat: parseFloat(ord.kitchen_latitude),
            lng: parseFloat(ord.kitchen_longitude),
          });
          hasPoints = true;
        }
      });

      if (hasPoints) {
        map.fitBounds(bounds);
      }
    }
  }, [supplierCoords, orders, map]);

  return null;
}

function SupplierTrackingMap({ supplierCoords, orders = [] }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyDsMrxBtfH08YQnLzvQRq75R_3RX7--D1c",
    libraries: GOOGLE_MAPS_LIBRARIES,
    preventGoogleFontsLoading: true,
  });

  const [map, setMap] = useState(null);
  const onLoad = useCallback((mapInstance) => setMap(mapInstance), []);
  const onUnmount = useCallback(() => setMap(null), []);

  const [icons, setIcons] = useState(null);
  const [directions, setDirections] = useState(null);
  const [routeInfo, setRouteInfo] = useState({ distance: "0 km", duration: "0 menit" });

  useEffect(() => {
    if (isLoaded && window.google) {
      setIcons({
        warehouse: {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          fillColor: "#10B981", // Green color for warehouse
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#FFFFFF",
          scale: 7,
        },
        kitchen: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#3B82F6", // Blue color for kitchen
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#FFFFFF",
          scale: 9,
        },
      });
    }
  }, [isLoaded]);

  // Hitung rute pengiriman multi-drop menggunakan DirectionsService
  useEffect(() => {
    if (!isLoaded || !window.google || !supplierCoords || orders.length === 0) {
      setDirections(null);
      return;
    }

    // Filter order yang aktif dikirim (pending, processing, shipped)
    const activeOrders = orders.filter(
      (o) => o.status === "processing" || o.status === "shipped" || o.status === "pending"
    );

    if (activeOrders.length === 0) {
      setDirections(null);
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    // Titik awal: Gudang Supplier
    const origin = supplierCoords;

    // Titik akhir: Kitchen terakhir dari daftar aktif
    const lastOrder = activeOrders[activeOrders.length - 1];
    const destination = {
      lat: parseFloat(lastOrder.kitchen_latitude),
      lng: parseFloat(lastOrder.kitchen_longitude),
    };

    // Waypoints: Kitchen di antaranya
    const waypoints = activeOrders.slice(0, -1).map((ord) => ({
      location: {
        lat: parseFloat(ord.kitchen_latitude),
        lng: parseFloat(ord.kitchen_longitude),
      },
      stopover: true,
    }));

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);

          // Hitung akumulasi jarak dan durasi
          let totalDistance = 0; // meter
          let totalDuration = 0; // detik
          const legs = result.routes[0].legs;
          legs.forEach((leg) => {
            totalDistance += leg.distance.value;
            totalDuration += leg.duration.value;
          });

          setRouteInfo({
            distance: `${(totalDistance / 1000).toFixed(1)} km`,
            duration: `${Math.round(totalDuration / 60)} menit`,
          });
        } else {
          console.error("Gagal menghitung rute pengiriman:", status);
        }
      }
    );
  }, [isLoaded, supplierCoords, orders]);

  // URL Navigasi Google Maps Multi-Stop
  const googleMapsUrl = useMemo(() => {
    if (!supplierCoords || orders.length === 0) return "";
    const activeOrders = orders.filter(
      (o) => o.status === "processing" || o.status === "shipped" || o.status === "pending"
    );
    if (activeOrders.length === 0) return "";

    const origin = `${supplierCoords.lat},${supplierCoords.lng}`;
    const destination = `${activeOrders[activeOrders.length - 1].kitchen_latitude},${activeOrders[activeOrders.length - 1].kitchen_longitude}`;
    const waypoints = activeOrders
      .slice(0, -1)
      .map((ord) => `${ord.kitchen_latitude},${ord.kitchen_longitude}`)
      .join("|");

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
  }, [supplierCoords, orders]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50 text-red-600 text-sm font-semibold p-4 rounded-2xl border border-red-100">
        Gagal memuat Google Maps. Hubungi administrator.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 text-gray-400">
        <Loader2 className="animate-spin mr-2" size={20} />
        <span>Memuat peta rute...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={supplierCoords || defaultCenter}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        }}
      >
        {/* Render Rute Jalan Raya */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: {
                strokeColor: "#10B981", // Emerald green color
                strokeOpacity: 0.8,
                strokeWeight: 5,
              },
              markerOptions: {
                visible: false, // Kita sembunyikan marker bawaan agar bisa custom
              },
            }}
          />
        )}

        {/* Marker Gudang Supplier */}
        {supplierCoords && icons && (
          <MarkerF
            position={supplierCoords}
            icon={icons.warehouse}
            title="Gudang Supplier (Titik Start)"
            zIndex={10}
          />
        )}

        {/* Marker Setiap Dapur Tujuan */}
        {orders
          .filter((o) => o.status !== "delivered")
          .map((ord) => {
            if (!ord.kitchen_latitude || !ord.kitchen_longitude || !icons) return null;
            return (
              <MarkerF
                key={ord.id}
                position={{
                  lat: parseFloat(ord.kitchen_latitude),
                  lng: parseFloat(ord.kitchen_longitude),
                }}
                icon={icons.kitchen}
                title={`Tujuan: ${ord.kitchen_name}`}
              />
            );
          })}

        {/* Auto-zoom fitting bounds */}
        <MapBounds supplierCoords={supplierCoords} orders={orders} map={map} />
      </GoogleMap>

      {/* Floating Info Panel */}
      {directions && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 max-w-xs z-10 space-y-3">
          <div>
            <h4 className="font-extrabold text-gray-800 text-sm">Jalur Pengantaran Multi-Drop</h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Rute Supplier Terpendek</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 border-y py-2.5 my-2">
            <div>
              <p className="text-[10px] text-gray-400 font-bold">JARAK TEMPUH</p>
              <p className="text-base font-extrabold text-emerald-600">{routeInfo.distance}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold">ESTIMASI WAKTU</p>
              <p className="text-base font-extrabold text-emerald-600">{routeInfo.duration}</p>
            </div>
          </div>

          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Mulai Navigasi Kurir
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default SupplierTrackingMap;
