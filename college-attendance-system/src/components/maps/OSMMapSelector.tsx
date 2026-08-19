import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Search, MapPin, Building2, Navigation, X, Loader2 } from 'lucide-react';
import L from 'leaflet';
import { searchColleges, searchNearbyBuildings, reverseGeocode, searchPlaces } from '../../services/googleMaps';
import { CollegeInfo, CampusLocation } from '../../types';
import { cn } from '../../lib/utils';

delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface OSMMapSelectorProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
  initialLocation?: { latitude: number; longitude: number };
  className?: string;
}

function LocationMarker({ position, onPositionChange }: { position: { lat: number; lng: number } | null; onPositionChange: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], map.getZoom());
    }
  }, [position, map]);

  return position ? (
    <Marker
      position={[position.lat, position.lng]}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          onPositionChange(lat, lng);
        },
      }}
    />
  ) : null;
}

export default function OSMMapSelector({ onLocationSelect, initialLocation, className }: OSMMapSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [colleges, setColleges] = useState<CollegeInfo[]>([]);
  const [placePredictions, setPlacePredictions] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<CampusLocation[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<CollegeInfo | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<CampusLocation | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : null
  );
  const [address, setAddress] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const initialCenter = currentLocation || { lat: 10.9367, lng: 76.9560 };

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
      const results = await searchPlaces(searchQuery);
      if (results && results.length > 0) {
        const preds = results.map((r: any) => ({
          description: r.description,
          placeId: r.placeId,
          structured: r.structured,
          lat: r.lat,
          lon: r.lon,
        }));
        setPlacePredictions(preds);
        setColleges([]);
      } else {
        setPlacePredictions([]);
        setColleges([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setPlacePredictions([]);
      setColleges([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePredictionSelect = async (pred: any) => {
    try {
      setPlacePredictions([]);
      setSearchQuery(pred.description || pred.structured?.main_text || '');
      const lat = pred.lat;
      const lng = pred.lon;
      if (lat && lng) {
        setCurrentLocation({ lat, lng });
        await updateLocation(lat, lng);
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
    setCurrentLocation({ lat: college.latitude, lng: college.longitude });
    updateLocation(college.latitude, college.longitude);
  };

  const handleBuildingSelect = (building: CampusLocation) => {
    setSelectedBuilding(building);
    setCurrentLocation({ lat: building.latitude, lng: building.longitude });
    updateLocation(building.latitude, building.longitude);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        updateLocation(latitude, longitude);
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
      <div className="map-container h-96 rounded-xl overflow-hidden border border-border">
        <MapContainer
          center={[initialCenter.lat, initialCenter.lng]}
          zoom={16}
          className="h-full w-full"
          zoomControl
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={currentLocation} onPositionChange={(lat, lng) => updateLocation(lat, lng)} />
        </MapContainer>
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
