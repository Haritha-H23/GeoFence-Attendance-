const NOMINATIM_USER_AGENT = 'GeoAttend/1.0';
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let googleMapsLoaded = false;
let googleMapsLoader: any = null;

export const initGoogleMaps = async (): Promise<any> => {
  if (googleMapsLoaded) return window.google;
  
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is not configured.');
  }

  if (!googleMapsLoader) {
    googleMapsLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google);
      script.onerror = () => reject(new Error('Failed to load Google Maps script'));
      document.head.appendChild(script);
    });
  }

  const google = await googleMapsLoader;
  googleMapsLoaded = true;
  return google;
};

export const getPlaceDetails = async (placeId: string): Promise<any> => {
  try {
    const google = await initGoogleMaps();
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    
    return new Promise((resolve, reject) => {
      service.getDetails(
        {
          placeId,
          fields: [
            'name',
            'formatted_address',
            'geometry',
            'website',
            'formatted_phone_number',
            'opening_hours',
            'photos',
            'types',
          ],
        },
        (place: any, status: any) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve({
              id: place.place_id,
              name: place.name,
              address: place.formatted_address,
              latitude: place.geometry?.location?.lat(),
              longitude: place.geometry?.location?.lng(),
              website: place.website,
              phone: place.formatted_phone_number,
              openingHours: place.opening_hours,
              photos: place.photos,
              types: place.types,
            });
          } else {
            reject(new Error(`Failed to get place details: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error getting place details:', error);
    throw error;
  }
};

const nominatimFetch = async (url: string): Promise<any> => {
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': NOMINATIM_USER_AGENT,
    },
  });
  if (!res.ok) throw new Error(`Nominatim request failed: ${res.status}`);
  return res.json();
};

export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const json = await nominatimFetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`
    );
    return json.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (e) {
    console.error('Reverse geocode error', e);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};

export const searchNearbyBuildings = async (
  lat: number,
  lng: number,
  radius: number = 500
): Promise<any[]> => {
  try {
    const json = await nominatimFetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1&zoom=18`
    );
    const addr = json.address || {};
    const candidates: { name: string; priority: number }[] = [];

    if (addr.building) candidates.push({ name: addr.building, priority: 1 });
    if (addr.amenity) candidates.push({ name: addr.amenity, priority: 2 });
    if (addr.shop) candidates.push({ name: addr.shop, priority: 3 });
    if (addr.office) candidates.push({ name: addr.office, priority: 4 });
    if (addr.road) candidates.push({ name: addr.road, priority: 5 });
    if (addr.suburb) candidates.push({ name: addr.suburb, priority: 6 });
    if (addr.city) candidates.push({ name: addr.city, priority: 7 });

    candidates.sort((a, b) => a.priority - b.priority);

    const results = candidates.slice(0, 3).map((c, i) => ({
      id: `${json.place_id || json.osm_id}-${i}`,
      name: c.name,
      address: json.display_name,
      latitude: Number(json.lat),
      longitude: Number(json.lon),
      placeId: String(json.place_id || json.osm_id),
      types: [],
    }));

    try {
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];(node["name"]["amenity"](around:${radius},${lat},${lng});node["name"]["shop"](around:${radius},${lat},${lng});node["name"]["tourism"](around:${radius},${lat},${lng});way["name"]["amenity"](around:${radius},${lat},${lng});way["name"]["shop"](around:${radius},${lat},${lng}););out body;`;
      const overpassData = await fetch(overpassUrl, {
        headers: { 'Accept': 'application/json', 'User-Agent': NOMINATIM_USER_AGENT },
      });
      if (overpassData.ok) {
        const elements = await overpassData.json();
        const poiCandidates: { name: string; priority: number }[] = [];
        for (const el of elements.elements || []) {
          const tags = el.tags || {};
          if (tags.name) {
            const type = tags.amenity || tags.shop || tags.tourism || 'place';
            poiCandidates.push({ name: tags.name, priority: type === 'amenity' ? 1 : type === 'shop' ? 2 : 3 });
          }
        }
        poiCandidates.sort((a, b) => a.priority - b.priority);
        const poiResults = poiCandidates.slice(0, 3).map((c, i) => ({
          id: `poi-${i}`,
          name: c.name,
          address: json.display_name,
          latitude: lat,
          longitude: lng,
          placeId: null,
          types: [],
        }));
        return [...results, ...poiResults].slice(0, 5);
      }
    } catch (overpassError) {
      console.warn('Overpass query failed, using Nominatim only:', overpassError);
    }

    return results;
  } catch (e) {
    console.error('Nearby buildings error', e);
    return [];
  }
};

export const searchColleges = async (query: string): Promise<any[]> => {
  try {
    const json = await nominatimFetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query + ' college university')}&limit=8&addressdetails=1`
    );
    return json.map((r: any) => ({
      id: r.place_id || r.osm_id,
      name: r.display_name,
      address: r.display_name,
      latitude: Number(r.lat),
      longitude: Number(r.lon),
      placeId: r.place_id,
      formattedAddress: r.display_name,
      rating: null,
      totalRatings: null,
    }));
  } catch (e) {
    console.error('College search error', e);
    return [];
  }
};

export const searchPlaces = async (input: string): Promise<any[]> => {
  try {
    const json = await nominatimFetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(input)}&limit=8&addressdetails=1`
    );
    return json.map((r: any) => ({
      description: r.display_name,
      placeId: r.place_id,
      structured: { main_text: r.display_name, secondary_text: '' },
      lat: Number(r.lat),
      lon: Number(r.lon),
    }));
  } catch (e) {
    console.error('Places search error', e);
    return [];
  }
};

export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371e3;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
