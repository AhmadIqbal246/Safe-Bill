import React, { useState, useCallback } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { serviceAreaOptions, regionToDepartments } from '../../constants/registerationTypes';
import { filterSellersByServiceArea, filterSellersByLocation } from '../../store/slices/FilterSlice';
import { filterSellersByRegion } from '../../store/slices/FilterSlice';

const containerStyle = { width: '100%', height: '300px', borderRadius: '0.75rem' };
const center = { lat: 37.7749, lng: -122.4194 };

// Helpers
const normalize = (s = '') => s
  .normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .toLowerCase().trim();

function pickCityAndPostal(components = []) {
  const byType = (t) => components.find(c => c.types?.includes(t))?.long_name || '';
  const city = byType('locality') || byType('postal_town');
  const postal = byType('postal_code');
  const department = byType('administrative_area_level_2');
  const region = byType('administrative_area_level_1');
  return { city, postal, department, region };
}

function mapComponentsToServiceAreaValue(components) {
  const { city, postal } = pickCityAndPostal(components);
  if (!city) return null;

  const targetFull = postal ? `${city} (${postal})` : city;
  const targetFullNorm = normalize(targetFull);
  const cityNorm = normalize(city);

  // Exact label match first ("City (ZIP)")
  let match = serviceAreaOptions.find(o => normalize(o.label) === targetFullNorm);
  if (match) return match.value;

  // Fallback: match by city substring
  match = serviceAreaOptions.find(o => normalize(o.label).includes(cityNorm));
  return match ? match.value : null;
}

function mapComponentsToRegionKey(components = []) {
  const { region } = pickCityAndPostal(components);
  const norm = normalize(region);
  // simple mappings for region names to our keys
  const map = {
    'auvergne-rhone-alpes': 'auvergne_rhone_alpes',
    'bourgogne-franche-comte': 'bourgogne_franche_comte',
    'bretagne': 'bretagne',
    'centre-val de loire': 'centre_val_de_loire',
    'corse': 'corse',
    'grand est': 'grand_est',
    'hauts-de-france': 'hauts_de_france',
    'normandie': 'normandie',
    'nouvelle-aquitaine': 'nouvelle_aquitaine',
    'occitanie': 'occitanie',
    'pays de la loire': 'pays_de_la_loire',
    "provence-alpes-cote d'azur": 'provence_alpes_cote_d_azur',
    'ile-de-france': 'ile_de_france',
    'guadeloupe': 'outre_mer',
    'martinique': 'outre_mer',
    'guyane': 'outre_mer',
    'la reunion': 'outre_mer',
    'mayotte': 'outre_mer',
  };
  return map[norm] || null;
}

export default function GeoFilterComponent() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [marker, setMarker] = useState(center);
  const [address, setAddress] = useState('Click on the map to select a location');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [matchedAreaLabel, setMatchedAreaLabel] = useState('');

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
        
        const value = mapComponentsToServiceAreaValue(result.address_components);
        if (value) {
          const opt = serviceAreaOptions.find(o => o.value === value);
          setMatchedAreaLabel(opt?.label || '');
          dispatch(filterSellersByServiceArea({ serviceArea: value }));
          const params = new URLSearchParams(location.search);
          params.set('area', value);
          navigate({ search: params.toString() }, { replace: false });
        } else {
          // Try region fallback
          const regionKey = mapComponentsToRegionKey(result.address_components);
          if (regionKey && regionToDepartments[regionKey]) {
            setMatchedAreaLabel('');
            dispatch(filterSellersByRegion(regionKey));
            const params = new URLSearchParams(location.search);
            params.set('region', regionKey);
            navigate({ search: params.toString() }, { replace: false });
            return;
          }
          // Ultimate fallback: flexible backend location filter
          setMatchedAreaLabel('');
          const { city, postal } = pickCityAndPostal(result.address_components);
          dispatch(filterSellersByLocation({ city, postalCode: postal, address: result.formatted_address }));
          const params = new URLSearchParams(location.search);
          if (postal) params.set('postal', postal);
          if (city) params.set('city', city);
          navigate({ search: params.toString() }, { replace: false });
        }
      } else {
        setAddress('Address not found. Please try another location.');
        console.error('Geocoding failed:', status);
      }
    });
  }, [dispatch, location.search, navigate]);

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
          {matchedAreaLabel && (
            <div className="mt-2 text-xs text-green-700 text-center">
              Matched service area: {matchedAreaLabel}
            </div>
          )}
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          Click anywhere on the map to get the address and filter professionals for that area
        </div>
      </div>
    </section>
  );
}