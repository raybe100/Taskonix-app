import { useState, useEffect, useCallback } from 'react';
import { Location } from '../types';
import { PlacesService, PlaceSearchResult } from '../services/PlacesService';
import { useItemsStore } from '../store/useItemsStore';

interface LocationManagerProps {
  className?: string;
}

export function LocationManager({ className = '' }: LocationManagerProps) {
  const {
    locations,
    loading,
    error,
    addLocation,
    updateLocation,
    deleteLocation,
    clearError
  } = useItemsStore();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Form state for adding/editing locations
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    lat: 0,
    lng: 0,
    radius_m: 150,
    place_id: ''
  });

  // Get user's current location on mount
  useEffect(() => {
    PlacesService.getCurrentLocation().then(setCurrentLocation);
  }, []);

  // Search for places
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await PlacesService.searchPlaces(query);
      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // Start adding a new location
  const startAdding = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      name: '',
      address: '',
      lat: 0,
      lng: 0,
      radius_m: 150,
      place_id: ''
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  // Start editing a location
  const startEditing = (location: Location) => {
    setIsAdding(false);
    setEditingId(location.id);
    setFormData({
      name: location.name,
      address: location.address || '',
      lat: location.lat,
      lng: location.lng,
      radius_m: location.radius_m,
      place_id: location.place_id || ''
    });
    setSearchQuery(location.name);
  };

  // Cancel adding/editing
  const cancelEditing = () => {
    setIsAdding(false);
    setEditingId(null);
    setSearchQuery('');
    setSearchResults([]);
    setFormData({
      name: '',
      address: '',
      lat: 0,
      lng: 0,
      radius_m: 150,
      place_id: ''
    });
  };

  // Select a place from search results
  const selectPlace = async (place: PlaceSearchResult) => {
    setFormData({
      name: place.name,
      address: place.formatted_address,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      radius_m: formData.radius_m,
      place_id: place.place_id
    });
    setSearchQuery(place.name);
    setSearchResults([]);
  };

  // Save location
  const saveLocation = async () => {
    if (!formData.name.trim() || !formData.lat || !formData.lng) {
      return;
    }

    try {
      if (editingId) {
        await updateLocation(editingId, {
          name: formData.name.trim(),
          address: formData.address,
          lat: formData.lat,
          lng: formData.lng,
          radius_m: formData.radius_m,
          place_id: formData.place_id
        });
      } else {
        await addLocation({
          name: formData.name.trim(),
          address: formData.address,
          lat: formData.lat,
          lng: formData.lng,
          radius_m: formData.radius_m,
          place_id: formData.place_id
        });
      }
      cancelEditing();
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  // Use current location
  const useCurrentLocation = async () => {
    if (!currentLocation) {
      const location = await PlacesService.getCurrentLocation();
      if (!location) {
        alert('Unable to get your current location. Please enable location permissions.');
        return;
      }
      setCurrentLocation(location);
    }

    // Reverse geocode to get address
    if (currentLocation) {
      const address = await PlacesService.reverseGeocode(currentLocation.lat, currentLocation.lng);
      
      setFormData(prev => ({
        ...prev,
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        address: address || '',
        name: prev.name || 'Current Location'
      }));
    }
  };

  // Format coordinates for display
  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Saved Locations
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Manage places for location-based reminders
          </p>
        </div>
        
        {!isAdding && !editingId && (
          <button
            onClick={startAdding}
            className="px-4 py-2 bg-primary-40 text-white rounded-lg hover:bg-primary-40/90 transition-colors flex items-center gap-2"
          >
            <span className="text-lg">📍</span>
            Add Location
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <button
              onClick={clearError}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingId ? 'Edit Location' : 'Add New Location'}
          </h3>

          <div className="space-y-4">
            {/* Search/Name Input */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Places or Enter Name
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-40 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Search for a place or enter custom name..."
              />

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((place) => (
                    <button
                      key={place.place_id}
                      onClick={() => selectPlace(place)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-600 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {place.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {place.formatted_address}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {isSearching && (
                <div className="absolute right-3 top-11 w-4 h-4 border-2 border-primary-40 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {/* Manual coordinates input */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={(e) => setFormData(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-40 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.lng}
                  onChange={(e) => setFormData(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-40 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Current location button */}
            <button
              onClick={useCurrentLocation}
              className="w-full py-2 px-4 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2"
            >
              <span>📍</span>
              Use My Current Location
            </button>

            {/* Name input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-40 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Home, Office, Gym"
                required
              />
            </div>

            {/* Radius input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Geofence Radius (meters)
              </label>
              <select
                value={formData.radius_m}
                onChange={(e) => setFormData(prev => ({ ...prev, radius_m: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-40 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={50}>50m - Very Close</option>
                <option value={100}>100m - Close</option>
                <option value={150}>150m - Normal</option>
                <option value={300}>300m - Large Area</option>
                <option value={500}>500m - Very Large</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Determines when location-based reminders trigger
              </p>
            </div>

            {/* Address display */}
            {formData.address && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300">
                  {formData.address}
                </div>
              </div>
            )}

            {/* Coordinates display */}
            {formData.lat !== 0 && formData.lng !== 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coordinates
                </label>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 font-mono">
                  {formatCoordinates(formData.lat, formData.lng)}
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={cancelEditing}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveLocation}
                disabled={!formData.name.trim() || formData.lat === 0 || formData.lng === 0 || loading}
                className="flex-1 px-4 py-3 bg-primary-40 text-white rounded-lg hover:bg-primary-40/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : (editingId ? 'Update' : 'Save')} Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Locations List */}
      <div className="space-y-4">
        {locations.length === 0 && !isAdding ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-2xl">📍</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Saved Locations
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Add locations to enable location-based reminders
            </p>
            <button
              onClick={startAdding}
              className="px-6 py-3 bg-primary-40 text-white rounded-lg hover:bg-primary-40/90 transition-colors"
            >
              Add Your First Location
            </button>
          </div>
        ) : (
          locations.map((location) => (
            <div
              key={location.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {location.name}
                    </h3>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                      {location.radius_m}m radius
                    </span>
                  </div>
                  
                  {location.address && (
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      {location.address}
                    </p>
                  )}
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {formatCoordinates(location.lat, location.lng)}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => startEditing(location)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Edit location"
                  >
                    ✏️
                  </button>
                  
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${location.name}"?`)) {
                        deleteLocation(location.id);
                      }
                    }}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Delete location"
                  >
                    🗑️
                  </button>

                  <button
                    onClick={() => {
                      // Open in Google Maps
                      const url = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
                      window.open(url, '_blank');
                    }}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="View in Google Maps"
                  >
                    🗺️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Service Status */}
      {!PlacesService.isConfigured() && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-yellow-600">⚠️</span>
            <div>
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                Google Places API Not Configured
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                Place search and address lookup features require a Google Places API key. 
                You can still add locations manually using coordinates.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}