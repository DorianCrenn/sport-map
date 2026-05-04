import L from 'leaflet';
import { SPORT_GROUPS } from '../data/events.js';

export function createSportMarker(sportGroup, isSelected = false) {
  const color = SPORT_GROUPS[sportGroup]?.color ?? '#6b7280';
  const size = isSelected ? 38 : 28;
  const tipH = isSelected ? 14 : 10;
  const strokeW = isSelected ? 2.5 : 1.5;

  const svg = `<svg width="${size}" height="${size + tipH}" viewBox="0 0 36 50" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 0 C8.059 0 0 8.059 0 18 C0 31.5 18 50 18 50 C18 50 36 31.5 36 18 C36 8.059 27.941 0 18 0 Z"
      fill="${color}" stroke="white" stroke-width="${strokeW}"/>
    <circle cx="18" cy="17" r="8" fill="white" opacity="0.9"/>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size + tipH],
    iconAnchor: [size / 2, size + tipH],
    popupAnchor: [0, -(size + tipH)],
  });
}
