import React, { useState, useCallback } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = { width: '100%', height: '300px', borderRadius: '0.75rem' };
const center = { lat: 37.7749, lng: -122.4194 };

export default function GeoFilterComponent() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY', // TODO: Replace with your key
    libraries: ['places'],
  });

  const [marker, setMarker] = useState(center);
  const [address, setAddress] = useState('Click on the map to select a location');
  const [isGeocoding, setIsGeocoding] = useState(false);

  const onMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarker({ lat, lng });
    setIsGeocoding(true);

    // Reverse geocode
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      setIsGeocoding(false);
      
      if (status === 'OK' && results && results.length > 0) {
        const result = results[0];
        setAddress(result.formatted_address);
        
        // You can also extract specific components like city, country, etc.
        const addressComponents = result.address_components;
        const city = addressComponents.find(component => 
          component.types.includes('locality') || 
          component.types.includes('administrative_area_level_1')
        );
        
        console.log('Full address:', result.formatted_address);
        console.log('City:', city?.long_name || 'Not found');
        console.log('All components:', addressComponents);
      } else {
        setAddress('Address not found. Please try another location.');
        console.error('Geocoding failed:', status);
      }
    });
  }, []);

  if (loadError) {
    return (
      <section className="w-full flex justify-center py-8 px-4 bg-white">
        <div className="bg-white rounded-xl shadow-md p-6 max-w-3xl w-full flex flex-col items-center">
          <div className="text-red-500 text-center">
            Error loading Google Maps. Please check your API key and internet connection.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full flex justify-center py-8 px-4 bg-white">
      <div className="bg-white rounded-xl shadow-md p-2 max-w-3xl w-full flex flex-col items-center">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={marker}
            zoom={12}
            onClick={onMapClick}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              styles: [
                { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                { featureType: 'transit', stylers: [{ visibility: 'off' }] },
              ],
            }}
          >
            <Marker position={marker} />
          </GoogleMap>
        ) : (
          <div className="w-full h-[300px] flex items-center justify-center bg-gray-100 rounded-xl">
            <div className="text-gray-600">Loading map...</div>
          </div>
        )}
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg w-full max-w-md">
          <div className="text-sm text-gray-600 mb-1">Selected Location:</div>
          <div className="text-center text-[#01257D] font-medium">
            {isGeocoding ? (
              <span className="text-gray-500">Finding address...</span>
            ) : (
              address
            )}
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          Click anywhere on the map to get the address
        </div>
      </div>
    </section>
  );
}