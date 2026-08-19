import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Building2, Navigation, X, Loader2 } from 'lucide-react';
import { initGoogleMaps, searchColleges, searchNearbyBuildings, reverseGeocode } from '../../services/googleMaps';
import { CollegeInfo, CampusLocation } from '../../types';
import { cn } from '../../lib/utils';

interface GoogleMapSelectorProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
  initialLocation?: { latitude: number; longitude: number };
  className?: string;
}

export default function GoogleMapSelector({ onLocationSelect, initialLocation, className }: GoogleMapSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [colleges, setColleges] = useState<CollegeInfo[]>([]);
  const [placePredictions, setPlacePredictions] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<CampusLocation[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<CollegeInfo | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<CampusLocation | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : null
  );
  const [address, setAddress] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      try {
        const google = await initGoogleMaps();
        
        if (!mapRef.current) return;

        const initialCenter = currentLocation || { lat: 10.9367, lng: 76.9560 };
        
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: initialCenter,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
            {
              featureType: 'transit',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        const markerInstance = new google.maps.Marker({
          position: initialCenter,
          map: mapInstance,
          draggable: true,
          animation: google.maps.Animation.DROP,
          title: 'Selected Location',
        });

        // Add click listener to map
        mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            markerInstance.setPosition(e.latLng);
            updateLocation(e.latLng.lat(), e.latLng.lng());
          }
        });

        // Add dragend listener to marker
        markerInstance.addListener('dragend', () => {
          const position = markerInstance.getPosition();
          if (position) {
            updateLocation(position.lat(), position.lng());
          }
        });

        setMap(mapInstance);
        setMarker(markerInstance);

        // Get address for initial location
        if (currentLocation) {
          updateLocation(currentLocation.lat, currentLocation.lng);
        }
      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    initMap();
  }, []);

  const updateLocation = async (lat: number, lng: number) => {
    setCurrentLocation({ lat, lng });
    setIsLoadingAddress(true);
    
    try {
      const addressText = await reverseGeocode(lat, lng);
      setAddress(addressText);
      
      // Search for nearby buildings
      const nearbyBuildings = await searchNearbyBuildings(lat, lng, 300);
      const formattedBuildings: CampusLocation[] = nearbyBuildings.map((b: any, index: number) => ({
        id: b.id || `building-${index}`,
        name: b.name,
        address: b.address,
        latitude: b.latitude,
        longitude: b.longitude,
        type: 'building',
      }));
      setBuildings(formattedBuildings);
    } catch (error) {
      console.error('Failed to get address:', error);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      console.log('Searching for:', searchQuery);
      // Use Nominatim directly (reliable, free, no key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(searchQuery)}&limit=8`,
        { headers: { 'User-Agent': 'GeoAttend/1.0' } }
      );
      if (response.ok) {
        const results = await response.json();
        console.log('Nominatim results:', results);
        if (results && results.length > 0) {
          const preds = results.map((r: any) => ({
            description: r.display_name,
            placeId: null,
            structured: { main_text: r.display_name, secondary_text: '' },
            lat: Number(r.lat),
            lon: Number(r.lon),
          }));
          setPlacePredictions(preds);
          setColleges([]);
          setIsSearching(false);
          return;
        }
      }
      console.warn('No results found');
      setPlacePredictions([]);
      setColleges([]);
    } catch (error) {
      console.error('Search failed:', error);
      setColleges([]);
      setPlacePredictions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePredictionSelect = async (pred: any) => {
    try {
      setPlacePredictions([]);
      setSearchQuery(pred.description || pred.structured?.main_text || '');
      // Use Nominatim lat/lon directly if available
      let lat = pred.lat, lng = pred.lon;
      if (!lat || !lng) {
        // Try Google if Nominatim didn't provide coords
        if (pred.placeId) {
          try {
            const details = await (await import('../../services/googleMaps')).getPlaceDetails(pred.placeId);
            lat = details.latitude || details.geometry?.location?.lat;
            lng = details.longitude || details.geometry?.location?.lng;
          } catch (e) {
            console.warn('Could not fetch Google details:', e);
          }
        }
      }
      if (lat && lng && map && marker) {
        const position = { lat, lng };
        map.panTo(position);
        map.setZoom(17);
        marker.setPosition(position as any);
        updateLocation(lat, lng);
      } else {
        console.warn('No valid coordinates for prediction:', pred);
      }
    } catch (e) {
      console.error('prediction select failed', e);
    }
  };

  const handleCollegeSelect = (college: CollegeInfo) => {
    setSelectedCollege(college);
    setSelectedBuilding(null);
    setSearchQuery('');
    setColleges([]);
    
    if (map && marker) {
      const position = { lat: college.latitude, lng: college.longitude };
      map.panTo(position);
      map.setZoom(17);
      marker.setPosition(position);
      updateLocation(college.latitude, college.longitude);
    }
  };

  const handleBuildingSelect = (building: CampusLocation) => {
    setSelectedBuilding(building);
    
    if (map && marker) {
      const position = { lat: building.latitude, lng: building.longitude };
      map.panTo(position);
      map.setZoom(18);
      marker.setPosition(position);
      updateLocation(building.latitude, building.longitude);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (map && marker) {
          const pos = { lat: latitude, lng: longitude };
          map.panTo(pos);
          map.setZoom(16);
          marker.setPosition(pos);
          updateLocation(latitude, longitude);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your current location. Please check your browser permissions.');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleConfirmLocation = () => {
    if (currentLocation) {
      onLocationSelect({
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        address: address || `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`,
      });
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for colleges, universities..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </button>
        </div>

        {/* Search Results */}
        {placePredictions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
            {placePredictions.map((p) => (
              <button key={p.placeId} onClick={() => handlePredictionSelect(p)} className="w-full p-3 text-left hover:bg-accent transition-colors border-b border-border last:border-b-0 flex items-start gap-3">
                <Building2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.structured?.main_text || p.description}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.structured?.secondary_text || ''}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        {colleges.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
            {colleges.map((college) => (
              <button
                key={college.id}
                onClick={() => handleCollegeSelect(college)}
                className="w-full p-3 text-left hover:bg-accent transition-colors border-b border-border last:border-b-0 flex items-start gap-3"
              >
                <Building2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{college.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{college.address}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="map-container h-96">
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Location Info */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Selected Location</span>
          </div>
          <button
            onClick={handleUseCurrentLocation}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Navigation className="h-3 w-3" />
            Use My Location
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {isLoadingAddress ? 'Loading address...' : address || 'No address available'}
              </p>
              {currentLocation && (
                <p className="text-xs text-muted-foreground">
                  {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </p>
              )}
            </div>
            {selectedCollege && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-lg">
                <Building2 className="h-3 w-3" />
                {selectedCollege.name}
              </span>
            )}
          </div>

          {/* Nearby Buildings */}
          {buildings.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Nearby Buildings</p>
              <div className="flex flex-wrap gap-2">
                {buildings.slice(0, 5).map((building) => (
                  <button
                    key={building.id}
                    onClick={() => handleBuildingSelect(building)}
                    className={cn(
                      'px-3 py-1.5 text-xs rounded-lg border transition-colors',
                      selectedBuilding?.id === building.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-accent text-accent-foreground border-border hover:bg-accent/80'
                    )}
                  >
                    {building.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirmLocation}
          disabled={!currentLocation}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Confirm This Location
        </button>
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Building2, Navigation, X, Loader2 } from 'lucide-react';
import { initGoogleMaps, searchColleges, searchNearbyBuildings, reverseGeocode, getPlaceDetails } from '../../services/googleMaps';
import { CollegeInfo, CampusLocation } from '../../types';
import { cn } from '../../lib/utils';

interface GoogleMapSelectorProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
  initialLocation?: { latitude: number; longitude: number };
  className?: string;
}

export default function GoogleMapSelector({ onLocationSelect, initialLocation, className }: GoogleMapSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [colleges, setColleges] = useState<CollegeInfo[]>([]);
  const [placePredictions, setPlacePredictions] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<CampusLocation[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<CollegeInfo | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<CampusLocation | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : null
  );
  const [address, setAddress] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        const google = await initGoogleMaps();
        
        if (!mapRef.current) return;

        const initialCenter = currentLocation || { lat: 10.9367, lng: 76.9560 };
        
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: initialCenter,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
            {
              featureType: 'transit',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        const markerInstance = new google.maps.Marker({
          position: initialCenter,
          map: mapInstance,
          draggable: true,
          animation: google.maps.Animation.DROP,
          title: 'Selected Location',
        });

        mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            markerInstance.setPosition(e.latLng);
            updateLocation(e.latLng.lat(), e.latLng.lng());
          }
        });

        markerInstance.addListener('dragend', () => {
          const position = markerInstance.getPosition();
          if (position) {
            updateLocation(position.lat(), position.lng());
          }
        });

        setMap(mapInstance);
        setMarker(markerInstance);

        if (currentLocation) {
          updateLocation(currentLocation.lat, currentLocation.lng);
        }
      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    initMap();
  }, []);

  const updateLocation = async (lat: number, lng: number) => {
    setCurrentLocation({ lat, lng });
    setIsLoadingAddress(true);
    
    try {
      const addressText = await reverseGeocode(lat, lng);
      setAddress(addressText);
      
      const nearbyBuildings = await searchNearbyBuildings(lat, lng, 300);
      const formattedBuildings: CampusLocation[] = nearbyBuildings.map((b: any, index: number) => ({
        id: b.id || `building-${index}`,
        name: b.name,
        address: b.address,
        latitude: b.latitude,
        longitude: b.longitude,
        type: 'building',
      }));
      setBuildings(formattedBuildings);
    } catch (error) {
      console.error('Failed to get address:', error);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      console.log('Searching for:', searchQuery);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(searchQuery)}&limit=8`,
        { headers: { 'User-Agent': 'GeoAttend/1.0' } }
      );
      if (response.ok) {
        const results = await response.json();
        console.log('Nominatim results:', results);
        if (results && results.length > 0) {
          const preds = results.map((r: any) => ({
            description: r.display_name,
            placeId: null,
            structured: { main_text: r.display_name, secondary_text: '' },
            lat: Number(r.lat),
            lon: Number(r.lon),
          }));
          setPlacePredictions(preds);
          setColleges([]);
          setIsSearching(false);
          return;
        }
      }
      console.warn('No results found');
      setPlacePredictions([]);
      setColleges([]);
    } catch (error) {
      console.error('Search failed:', error);
      setColleges([]);
      setPlacePredictions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePredictionSelect = async (pred: any) => {
    try {
      setPlacePredictions([]);
      setSearchQuery(pred.description || pred.structured?.main_text || '');
      let lat = pred.lat, lng = pred.lon;
      if (!lat || !lng) {
        if (pred.placeId) {
          try {
            const details = await getPlaceDetails(pred.placeId);
            lat = details.latitude || details.geometry?.location?.lat;
            lng = details.longitude || details.geometry?.location?.lng;
          } catch (e) {
            console.warn('Could not fetch Google details:', e);
          }
        }
      }
      if (lat && lng && map && marker) {
        const position = { lat, lng };
        map.panTo(position);
        map.setZoom(17);
        marker.setPosition(position as any);
        updateLocation(lat, lng);
      } else {
        console.warn('No valid coordinates for prediction:', pred);
      }
    } catch (e) {
      console.error('prediction select failed', e);
    }
  };

  const handleCollegeSelect = (college: CollegeInfo) => {
    setSelectedCollege(college);
    setSelectedBuilding(null);
    setSearchQuery('');
    setColleges([]);
    
    if (map && marker) {
      const position = { lat: college.latitude, lng: college.longitude };
      map.panTo(position);
      map.setZoom(17);
      marker.setPosition(position);
      updateLocation(college.latitude, college.longitude);
    }
  };

  const handleBuildingSelect = (building: CampusLocation) => {
    setSelectedBuilding(building);
    
    if (map && marker) {
      const position = { lat: building.latitude, lng: building.longitude };
      map.panTo(position);
      map.setZoom(18);
      marker.setPosition(position);
      updateLocation(building.latitude, building.longitude);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (map && marker) {
          const pos = { lat: latitude, lng: longitude };
          map.panTo(pos);
          map.setZoom(16);
          marker.setPosition(pos);
          updateLocation(latitude, longitude);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your current location. Please check your browser permissions.');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleConfirmLocation = () => {
    if (currentLocation) {
      onLocationSelect({
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        address: address || `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`,
      });
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for colleges, universities..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </button>
        </div>

        {/* Search Results */}
        {placePredictions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
            {placePredictions.map((p) => (
              <button key={p.placeId} onClick={() => handlePredictionSelect(p)} className="w-full p-3 text-left hover:bg-accent transition-colors border-b border-border last:border-b-0 flex items-start gap-3">
                <Building2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.structured?.main_text || p.description}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.structured?.secondary_text || ''}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        {colleges.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
            {colleges.map((college) => (
              <button
                key={college.id}
                onClick={() => handleCollegeSelect(college)}
                className="w-full p-3 text-left hover:bg-accent transition-colors border-b border-border last:border-b-0 flex items-start gap-3"
              >
                <Building2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{college.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{college.address}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="map-container h-96">
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Location Info */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Selected Location</span>
          </div>
          <button
            onClick={handleUseCurrentLocation}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Navigation className="h-3 w-3" />
            Use My Location
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {isLoadingAddress ? 'Loading address...' : address || 'No address available'}
              </p>
              {currentLocation && (
                <p className="text-xs text-muted-foreground">
                  {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </p>
              )}
            </div>
            {selectedCollege && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-lg">
                <Building2 className="h-3 w-3" />
                {selectedCollege.name}
              </span>
            )}
          </div>

          {/* Nearby Buildings */}
          {buildings.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Nearby Buildings</p>
              <div className="flex flex-wrap gap-2">
                {buildings.slice(0, 5).map((building) => (
                  <button
                    key={building.id}
                    onClick={() => handleBuildingSelect(building)}
                    className={cn(
                      'px-3 py-1.5 text-xs rounded-lg border transition-colors',
                      selectedBuilding?.id === building.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-accent text-accent-foreground border-border hover:bg-accent/80'
                    )}
                  >
                    {building.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirmLocation}
          disabled={!currentLocation}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Confirm This Location
        </button>
      </div>
    </div>
  );
}
