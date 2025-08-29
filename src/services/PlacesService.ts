import { DistanceMatrixResult } from '../types';

export interface PlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
}

export interface NearbySearchRequest {
  location: { lat: number; lng: number };
  radius: number;
  type?: string;
  keyword?: string;
}

export interface DistanceMatrixRequest {
  origins: Array<{ lat: number; lng: number }>;
  destinations: Array<{ lat: number; lng: number }>;
  mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
  units?: 'metric' | 'imperial';
}

export class PlacesService {
  private static apiKey: string | undefined = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  private static distanceMatrixApiKey: string | undefined = import.meta.env.VITE_GOOGLE_DISTANCE_MATRIX_API_KEY;

  // Check if the service is configured
  static isConfigured(): boolean {
    return !!(this.apiKey && this.apiKey !== 'your_google_places_api_key');
  }

  // Search for places by text query
  static async searchPlaces(query: string): Promise<PlaceSearchResult[]> {
    if (!this.isConfigured()) {
      console.warn('Google Places API key not configured');
      return [];
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Places API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      return data.results || [];
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  }

  // Find places near a location
  static async findNearbyPlaces(request: NearbySearchRequest): Promise<PlaceSearchResult[]> {
    if (!this.isConfigured()) {
      console.warn('Google Places API key not configured');
      return [];
    }

    try {
      const { location, radius, type, keyword } = request;
      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&key=${this.apiKey}`;
      
      if (type) {
        url += `&type=${type}`;
      }
      
      if (keyword) {
        url += `&keyword=${encodeURIComponent(keyword)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Nearby search error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Nearby search error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      return data.results || [];
    } catch (error) {
      console.error('Error finding nearby places:', error);
      return [];
    }
  }

  // Get place details by place ID
  static async getPlaceDetails(placeId: string): Promise<PlaceSearchResult | null> {
    if (!this.isConfigured()) {
      console.warn('Google Places API key not configured');
      return null;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,types,rating,user_ratings_total,photos&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Place details error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Place details error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      return data.result || null;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }

  // Calculate distance and travel time between locations
  static async calculateDistance(request: DistanceMatrixRequest): Promise<DistanceMatrixResult[][]> {
    const apiKey = this.distanceMatrixApiKey || this.apiKey;
    
    if (!apiKey) {
      console.warn('Google Distance Matrix API key not configured');
      return [];
    }

    try {
      const { origins, destinations, mode = 'driving', units = 'metric' } = request;
      
      const originsStr = origins.map(o => `${o.lat},${o.lng}`).join('|');
      const destinationsStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destinationsStr}&mode=${mode}&units=${units}&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Distance Matrix error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Distance Matrix error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      return data.rows?.map((row: any) => row.elements) || [];
    } catch (error) {
      console.error('Error calculating distance:', error);
      return [];
    }
  }

  // Autocomplete place suggestions
  static async getAutocompleteSuggestions(input: string, location?: { lat: number; lng: number }): Promise<Array<{
    place_id: string;
    description: string;
    matched_substrings: Array<{ length: number; offset: number }>;
    structured_formatting: {
      main_text: string;
      secondary_text?: string;
    };
    types: string[];
  }>> {
    if (!this.isConfigured() || !input.trim()) {
      return [];
    }

    try {
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${this.apiKey}`;
      
      if (location) {
        url += `&location=${location.lat},${location.lng}&radius=50000`; // 50km radius
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Autocomplete error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Autocomplete error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      return data.predictions || [];
    } catch (error) {
      console.error('Error getting autocomplete suggestions:', error);
      return [];
    }
  }

  // Get current location using browser geolocation
  static async getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return null;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  // Reverse geocode coordinates to address
  static async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    if (!this.isConfigured()) {
      console.warn('Google Places API key not configured');
      return null;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Geocoding error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK' || !data.results?.length) {
        return null;
      }

      return data.results[0].formatted_address;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  // Get travel time between two locations
  static async getTravelTime(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
  ): Promise<{ duration: number; distance: number } | null> {
    try {
      const results = await this.calculateDistance({
        origins: [origin],
        destinations: [destination],
        mode
      });

      if (results.length > 0 && results[0].length > 0) {
        const result = results[0][0];
        if (result.status === 'OK') {
          return {
            duration: result.duration.value, // seconds
            distance: result.distance.value // meters
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting travel time:', error);
      return null;
    }
  }

  // Common place types for filtering
  static getCommonPlaceTypes(): Array<{ id: string; name: string; icon: string }> {
    return [
      { id: 'restaurant', name: 'Restaurants', icon: '🍽️' },
      { id: 'gas_station', name: 'Gas Stations', icon: '⛽' },
      { id: 'hospital', name: 'Hospitals', icon: '🏥' },
      { id: 'pharmacy', name: 'Pharmacies', icon: '💊' },
      { id: 'bank', name: 'Banks', icon: '🏦' },
      { id: 'atm', name: 'ATMs', icon: '🏧' },
      { id: 'grocery_or_supermarket', name: 'Grocery Stores', icon: '🛒' },
      { id: 'shopping_mall', name: 'Shopping Malls', icon: '🛍️' },
      { id: 'gym', name: 'Gyms', icon: '💪' },
      { id: 'school', name: 'Schools', icon: '🏫' },
      { id: 'library', name: 'Libraries', icon: '📚' },
      { id: 'park', name: 'Parks', icon: '🏞️' },
      { id: 'movie_theater', name: 'Movie Theaters', icon: '🎬' },
      { id: 'airport', name: 'Airports', icon: '✈️' },
      { id: 'subway_station', name: 'Subway Stations', icon: '🚇' }
    ];
  }

  // Format distance for display
  static formatDistance(meters: number, units: 'metric' | 'imperial' = 'metric'): string {
    if (units === 'imperial') {
      const feet = meters * 3.28084;
      const miles = feet / 5280;
      
      if (miles >= 1) {
        return `${miles.toFixed(1)} mi`;
      } else {
        return `${Math.round(feet)} ft`;
      }
    } else {
      if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
      } else {
        return `${Math.round(meters)} m`;
      }
    }
  }

  // Format duration for display
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  }
}