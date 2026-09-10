import React, { useEffect, useRef, useState } from 'react';
import { LeafletMap } from './LeafletMap';

interface MapSpace {
  id: string;
  name: string;
  pricePerHour: number;
  latitude: number;
  longitude: number;
  aiScore?: number;
}

interface GoogleMapComponentProps {
  center: [number, number];
  spaces: MapSpace[];
  selectedSpaceId?: string | null;
  onSelectSpace?: (spaceId: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  onAutocompleteSelect?: (lat: number, lng: number, address: string) => void;
}

declare global {
  interface Window {
    google: any;
    initGoogleMapCallback?: () => void;
  }
}

export const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  center,
  spaces,
  selectedSpaceId,
  onSelectSpace,
  onMapClick,
  onAutocompleteSelect,
}) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [loadStatus, setLoadStatus] = useState<'LOADING' | 'GOOGLE' | 'LEAFLET'>('LOADING');
  
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const centerMarkerRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);

  // Fetch API key from backend config
  useEffect(() => {
    const fetchKey = async () => {
      try {
        const res = await fetch('/api/config/google-maps-key');
        const data = await res.json();
        if (data.apiKey) {
          setApiKey(data.apiKey);
          loadGoogleScript(data.apiKey);
        } else {
          // If no key is set in .env, immediately fallback to Leaflet Map
          setLoadStatus('LEAFLET');
        }
      } catch (err) {
        console.error('Failed to fetch Maps config key, falling back to Leaflet:', err);
        setLoadStatus('LEAFLET');
      }
    };
    fetchKey();
  }, []);

  // Dynamically inject Google Maps SDK
  const loadGoogleScript = (key: string) => {
    if (window.google && window.google.maps) {
      setLoadStatus('GOOGLE');
      return;
    }

    const scriptId = 'google-maps-sdk';
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.addEventListener('load', () => setLoadStatus('GOOGLE'));
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setLoadStatus('GOOGLE');
    };
    
    script.onerror = () => {
      console.warn('Google Maps Script failed to load, falling back to Leaflet.');
      setLoadStatus('LEAFLET');
    };

    document.head.appendChild(script);
  };

  // Initialize and update Google Map
  useEffect(() => {
    if (loadStatus !== 'GOOGLE' || !containerRef.current || !window.google) return;

    const googleMaps = window.google.maps;

    // 1. Initialize Map once
    if (!mapRef.current) {
      mapRef.current = new googleMaps.Map(containerRef.current, {
        center: { lat: center[0], lng: center[1] },
        zoom: 15,
        disableDefaultUI: false,
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        styles: [
          {
            featureType: 'poi.business',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Bind Map Click coordinate trigger
      mapRef.current.addListener('click', (e: any) => {
        if (onMapClick && e.latLng) {
          onMapClick(e.latLng.lat(), e.latLng.lng());
        }
      });
    }

    const map = mapRef.current;

    // 2. Update Map view center
    map.setCenter({ lat: center[0], lng: center[1] });

    // 3. Clear and draw user search target destination marker + walking radius
    if (centerMarkerRef.current) centerMarkerRef.current.setMap(null);
    if (radiusCircleRef.current) radiusCircleRef.current.setMap(null);

    centerMarkerRef.current = new googleMaps.Marker({
      position: { lat: center[0], lng: center[1] },
      map: map,
      title: 'Your Destination',
      icon: {
        path: googleMaps.SymbolPath.CIRCLE,
        fillColor: '#ec4899',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 8,
      }
    });

    radiusCircleRef.current = new googleMaps.Circle({
      map: map,
      radius: 500, // 500 meters walking boundary
      fillColor: '#ec4899',
      fillOpacity: 0.05,
      strokeColor: '#ec4899',
      strokeOpacity: 0.2,
      strokeWeight: 1,
    });
    radiusCircleRef.current.bindTo('center', centerMarkerRef.current, 'position');

    // 4. Update listings markers
    // Clear old markers
    Object.values(markersRef.current).forEach((marker) => marker.setMap(null));
    markersRef.current = {};

    spaces.forEach((space) => {
      const isSelected = space.id === selectedSpaceId;
      const hasHighAI = space.aiScore && space.aiScore >= 85;

      const marker = new googleMaps.Marker({
        position: { lat: space.latitude, lng: space.longitude },
        map: map,
        title: space.name,
        // Price badge label styling
        label: {
          text: `₹${space.pricePerHour}`,
          color: isSelected ? '#ffffff' : '#1f2937',
          fontWeight: 'black',
          fontSize: '11px',
        },
        icon: {
          path: googleMaps.SymbolPath.CIRCLE,
          fillColor: isSelected ? '#4f46e5' : hasHighAI ? '#10b981' : '#ffffff',
          fillOpacity: 1,
          strokeColor: isSelected ? '#ffffff' : '#d1d5db',
          strokeWeight: 2.5,
          scale: 18,
          labelOrigin: new googleMaps.Point(0, 0)
        }
      });

      marker.addListener('click', () => {
        if (onSelectSpace) {
          onSelectSpace(space.id);
        }
      });

      markersRef.current[space.id] = marker;
    });

  }, [loadStatus, center, spaces]);

  // Handle selected marker centering highlight
  useEffect(() => {
    if (loadStatus !== 'GOOGLE' || !selectedSpaceId) return;
    const selectedMarker = markersRef.current[selectedSpaceId];
    if (selectedMarker && mapRef.current) {
      mapRef.current.panTo(selectedMarker.getPosition());
    }
  }, [selectedSpaceId, loadStatus]);

  // Bind Autocomplete Places Search to target input box
  useEffect(() => {
    if (loadStatus !== 'GOOGLE' || !window.google) return;

    const input = document.getElementById('search-destination-input') as HTMLInputElement;
    if (!input) return;

    const googleMaps = window.google.maps;
    const autocomplete = new googleMaps.places.Autocomplete(input, {
      fields: ['geometry', 'name', 'formatted_address'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location && onAutocompleteSelect) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        onAutocompleteSelect(
          lat,
          lng,
          place.formatted_address || place.name || ''
        );
      }
    });

    // Cleanup listeners
    return () => {
      googleMaps.event.clearInstanceListeners(autocomplete);
    };
  }, [loadStatus]);

  if (loadStatus === 'LEAFLET') {
    return (
      <LeafletMap
        center={center}
        spaces={spaces}
        selectedSpaceId={selectedSpaceId}
        onSelectSpace={onSelectSpace}
        onMapClick={onMapClick}
      />
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
      {loadStatus === 'LOADING' ? (
        <div className="w-full h-full absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white z-20">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
          <span className="text-xs text-gray-400 font-semibold">Configuring Google Map Framework...</span>
        </div>
      ) : null}
      
      <div ref={containerRef} className="w-full h-full absolute inset-0 z-0" />

      {/* Google Map Floating legend */}
      {loadStatus === 'GOOGLE' && (
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-gray-100 flex flex-col gap-1 text-[11px] font-medium text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Destination</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Best Match / High AI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <span>Selected Spot</span>
          </div>
        </div>
      )}
    </div>
  );
};
export default GoogleMapComponent;
