<<<<<<< HEAD
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
=======
import { Loader } from '@googlemaps/js-api-loader';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let googleMapsLoader: Loader | null = null;
let googleMapsLoaded = false;

export const initGoogleMaps = async () => {
  if (googleMapsLoaded) return window.google;
  
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.');
  }

  googleMapsLoader = new Loader({
    apiKey: GOOGLE_MAPS_API_KEY,
    version: 'weekly',
    libraries: ['places', 'geometry'],
  });

  try {
    const google = await googleMapsLoader.load();
    googleMapsLoaded = true;
    return google;
  } catch (error) {
    console.error('Failed to load Google Maps:', error);
    throw error;
  }
};

export const searchColleges = async (query: string): Promise<any[]> => {
  try {
    const google = await initGoogleMaps();
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    
    return new Promise((resolve, reject) => {
      service.textSearch(
        {
          query: `${query} college university`,
          type: 'university',
        },
        (results: google.maps.places.PlaceResult[] | null, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const colleges = results.map((place: any) => ({
              id: place.place_id,
              name: place.name,
              address: place.formatted_address,
              latitude: place.geometry?.location?.lat(),
              longitude: place.geometry?.location?.lng(),
              placeId: place.place_id,
              formattedAddress: place.formatted_address,
              rating: place.rating,
              totalRatings: place.user_ratings_total,
            }));
            resolve(colleges);
          } else {
            reject(new Error(`Places search failed: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    console.warn(
  'Google Places unavailable, falling back to Nominatim search:',
  error instanceof Error ? error.message : error
);
   
    // Nominatim fallback
    try {
      const nom = await nominatimSearch(`${query} college`);
      return nom.map((r: any) => ({
        id: r.place_id || r.osm_id,
        name: r.display_name,
        address: r.display_name,
        latitude: Number(r.lat),
        longitude: Number(r.lon),
        placeId: null,
        formattedAddress: r.display_name,
        rating: null,
        totalRatings: null,
      }));
    } catch (e) {
      console.error('Nominatim fallback failed', e);
      return [];
    }
  }
>>>>>>> 2ff4898e648de7eafa85b9492fb899cc39d82065
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
<<<<<<< HEAD
        (place: any, status: any) => {
=======
        (place, status) => {
>>>>>>> 2ff4898e648de7eafa85b9492fb899cc39d82065
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

<<<<<<< HEAD
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
=======
export const searchPlaces = async (input: string): Promise<any[]> => {
  try {
    const google = await initGoogleMaps();
    const service = new google.maps.places.AutocompleteService();
    return new Promise((resolve, reject) => {
      service.getPlacePredictions({ input }, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          resolve(predictions.map(p => ({ description: p.description, placeId: p.place_id, structured: p.structured_formatting })));
        } else {
          resolve([]);
        }
      });
    });
  } catch (e) {
    console.warn(
  'Autocomplete unavailable, using Nominatim search fallback:',
  e instanceof Error ? e.message : e
);
    try {
      const nom = await nominatimSearch(input);
      return nom.map((r: any) => ({ description: r.display_name, placeId: null, structured: { main_text: r.display_name, secondary_text: '' } }));
    } catch (ee) {
      console.error('Nominatim fallback failed', ee);
      return [];
    }
>>>>>>> 2ff4898e648de7eafa85b9492fb899cc39d82065
  }
};

export const searchNearbyBuildings = async (
  lat: number,
  lng: number,
  radius: number = 500
): Promise<any[]> => {
  try {
<<<<<<< HEAD
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
=======
    const google = await initGoogleMaps();
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    
    return new Promise((resolve, reject) => {
      // use broader POI/establishment search so small blocks/labs are returned
      service.nearbySearch(
        {
          location: { lat, lng },
          radius,
          type: 'establishment',
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const buildings = results.map((place: any) => ({
              id: place.place_id,
              name: place.name,
              address: place.vicinity || place.formatted_address,
              latitude: place.geometry?.location?.lat(),
              longitude: place.geometry?.location?.lng(),
              placeId: place.place_id,
              types: place.types,
            }));
            resolve(buildings);
          } else {
            reject(new Error(`Nearby search failed: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    console.warn(
  'Google nearby search failed, falling back to reverse geocode OSM:',
  error instanceof Error ? error.message : error
);
    try {
      const addr = await reverseGeocodeOSM(lat, lng);
      return [{ id: null, name: addr, address: addr, latitude: lat, longitude: lng, placeId: null, types: [] }];
    } catch (e) {
      console.error('Nearby fallback failed', e);
      return [];
    }
  }
};

export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const google = await initGoogleMaps();
    const geocoder = new google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode(
        { location: { lat, lng } },
        (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
            resolve(results[0].formatted_address);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    throw error;
  }
};

// Fallback reverse geocoding using OpenStreetMap Nominatim (no API key required)
export const reverseGeocodeOSM = async (lat: number, lng: number): Promise<string> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'GeoAttend/1.0' } });
    if (!res.ok) throw new Error('OSM reverse geocode failed');
    const json = await res.json();
    return json.display_name || '';
  } catch (e) {
    console.error('OSM reverse geocode error', e);
    throw e;
  }
};

const nominatimSearch = async (query: string, limit = 8): Promise<any[]> => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'GeoAttend/1.0' } });
    if (!res.ok) throw new Error('Nominatim search failed');
    const json = await res.json();
    return json;
  } catch (e) {
    console.error('Nominatim search error', e);
    throw e;
>>>>>>> 2ff4898e648de7eafa85b9492fb899cc39d82065
  }
};

export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
<<<<<<< HEAD
  const R = 6371e3;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
=======
  const google = window.google;
  if (!google) return 0;
  
  const point1 = new google.maps.LatLng(lat1, lng1);
  const point2 = new google.maps.LatLng(lat2, lng2);
  
  return google.maps.geometry.spherical.computeDistanceBetween(point1, point2);
};
>>>>>>> 2ff4898e648de7eafa85b9492fb899cc39d82065
