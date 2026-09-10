import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';

interface MapSpace {
  id: string;
  name: string;
  pricePerHour: number;
  latitude: number;
  longitude: number;
  aiScore?: number;
}

interface LeafletMapProps {
  center: [number, number];
  spaces: MapSpace[];
  selectedSpaceId?: string | null;
  onSelectSpace?: (spaceId: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center,
  spaces,
  selectedSpaceId,
  onSelectSpace,
  onMapClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const centerMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  // Keep onMapClick in a ref so it's always up-to-date in the map event listener without causing re-initialization
  const onMapClickRef = useRef(onMapClick);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Initialize Map strictly once on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map instance
    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: 15,
      zoomControl: false,
    });

    // Add Tile Layer (OpenStreetMap CartoDB Voyager - Premium Dark/Light hybrid feel)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20,
    }).addTo(map);

    // Add custom zoom control in top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Bind map click handler using the ref
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClickRef.current) {
        onMapClickRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // Run strictly once on mount

  // Update center, plot search location marker & walking radius
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.setView(center, map.getZoom());

    // Remove existing search marker and radius circle
    if (centerMarkerRef.current) map.removeLayer(centerMarkerRef.current);
    if (radiusCircleRef.current) map.removeLayer(radiusCircleRef.current);

    // Custom pulse marker for the user's destination
    const destinationIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute w-8 h-8 rounded-full bg-rose-500 opacity-30 animate-ping"></div>
          <div class="w-4 h-4 rounded-full bg-rose-600 border-2 border-white shadow-md z-10"></div>
        </div>
      `,
      className: 'custom-destination-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    centerMarkerRef.current = L.marker(center, { icon: destinationIcon })
      .addTo(map)
      .bindPopup('Your Destination')
      .openPopup();

    // 500m walking radius circle (subtle overlay)
    radiusCircleRef.current = L.circle(center, {
      radius: 500,
      color: '#ec4899',
      fillColor: '#ec4899',
      fillOpacity: 0.05,
      weight: 1,
      dashArray: '5, 5',
    }).addTo(map);

  }, [center]);

  // Plot and update space markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    Object.values(markersRef.current).forEach((marker) => {
      map.removeLayer(marker);
    });
    markersRef.current = {};

    // Plot new markers
    spaces.forEach((space) => {
      const isSelected = space.id === selectedSpaceId;
      const hasHighAI = space.aiScore && space.aiScore >= 85;

      const markerHtml = `
        <div class="relative flex items-center justify-center transition-all duration-300 transform ${
          isSelected ? 'scale-125' : 'hover:scale-110'
        }">
          <!-- Highlight pulse for top match -->
          ${hasHighAI ? '<div class="absolute -inset-1 rounded-full bg-emerald-400 opacity-60 blur animate-pulse"></div>' : ''}
          <div class="flex items-center justify-center px-2.5 py-1.5 rounded-full font-bold text-xs shadow-lg border border-white z-10 transition-colors ${
            isSelected
              ? 'bg-indigo-600 text-white scale-105'
              : hasHighAI
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-gray-800'
          }">
            ₹${space.pricePerHour}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: `space-price-marker-${space.id}`,
        iconSize: [50, 30],
        iconAnchor: [25, 15],
      });

      const marker = L.marker([space.latitude, space.longitude], { icon: customIcon })
        .addTo(map)
        .on('click', () => {
          if (onSelectSpace) {
            onSelectSpace(space.id);
          }
        });

      markersRef.current[space.id] = marker;
    });
  }, [spaces, selectedSpaceId]);

  // Center on selected space
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedSpaceId) return;

    const selectedMarker = markersRef.current[selectedSpaceId];
    if (selectedMarker) {
      map.panTo(selectedMarker.getLatLng());
    }
  }, [selectedSpaceId]);

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0" />
      
      {/* Map floating helper UI */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-gray-100 flex flex-col gap-1 text-[11px] font-medium text-gray-600">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Destination</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          <span>Best Match / High AI Score</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
          <span>Selected Space</span>
        </div>
      </div>
    </div>
  );
};
export default LeafletMap;
