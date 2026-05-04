import L from 'leaflet';
import { SPORT_GROUPS } from '../data/events.js';

export function createSportMarker(sportGroup, isSelected = false) {
  const color = SPORT_GROUPS[sportGroup]?.color ?? '#6b7280';
  const size = isSelected ? 38 : 30;
  const tipH = isSelected ? 14 : 11;
  const strokeW = isSelected ? 3.5 : 2.5;
  const dotR = isSelected ? 7 : 5;
  const shadow = isSelected
    ? `drop-shadow(0 0 5px ${color}80)`
    : 'drop-shadow(0 2px 3px rgba(0,0,0,0.22))';

  const svg = `<svg width="${size}" height="${size + tipH}" viewBox="0 0 36 50" xmlns="http://www.w3.org/2000/svg" style="filter:${shadow}">
    <path d="M18 0 C8.059 0 0 8.059 0 18 C0 31.5 18 50 18 50 C18 50 36 31.5 36 18 C36 8.059 27.941 0 18 0 Z"
      fill="white" stroke="${color}" stroke-width="${strokeW}"/>
    <circle cx="18" cy="17" r="${dotR}" fill="${color}"/>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size + tipH],
    iconAnchor: [size / 2, size + tipH],
    popupAnchor: [0, -(size + tipH)],
  });
}
