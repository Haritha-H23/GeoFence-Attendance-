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
        (place, status) => {
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
  }
};

export const searchNearbyBuildings = async (
  lat: number,
  lng: number,
  radius: number = 500
): Promise<any[]> => {
  try {
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
  }
};

export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const google = window.google;
  if (!google) return 0;
  
  const point1 = new google.maps.LatLng(lat1, lng1);
  const point2 = new google.maps.LatLng(lat2, lng2);
  
  return google.maps.geometry.spherical.computeDistanceBetween(point1, point2);
};