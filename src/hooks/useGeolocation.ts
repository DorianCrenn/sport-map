import { useState, useCallback } from 'react';
import type { GeoCoords } from '../types/sportlink.js';

interface GeolocationResult {
  coords: GeoCoords | null;
  loading: boolean;
  error: string | null;
  request: () => void;
}

export function useGeolocation(): GeolocationResult {
  const [coords, setCoords]   = useState<GeoCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée par ce navigateur.');
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        setError("Impossible d'obtenir votre position.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  return { coords, loading, error, request };
}
