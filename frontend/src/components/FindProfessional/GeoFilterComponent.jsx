import React, { useState, useCallback } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = { width: '100%', height: '300px', borderRadius: '0.75rem' };
const center = { lat: 37.7749, lng: -122.4194 };

export default function GeoFilterComponent() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY', // TODO: Replace with your key
    libraries: ['places'],
  });

  const [marker, setMarker] = useState(center);
  const [address, setAddress] = useState('');

  const onMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarker({ lat, lng });

    // Reverse geocode
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        setAddress(results[0].formatted_address);
      } else {
        setAddress('Address not found');
      }
    });
  }, []);

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
          <div className="w-full h-[300px] flex items-center justify-center">Loading...</div>
        )}
        <div className="mt-4 text-center text-[#01257D] font-medium">{address}</div>
    </div>
    </section>
  );
}
