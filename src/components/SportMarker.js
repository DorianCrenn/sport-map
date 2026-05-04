import L from 'leaflet';
import { SPORT_GROUPS } from '../data/events.js';

export function createClusterMarker(count, color = '#64748b', isSelected = false) {
  const size = isSelected ? 42 : 34;
  const strokeW = isSelected ? 3.5 : 2.5;
  const fontSize = count > 9 ? (isSelected ? 14 : 12) : (isSelected ? 17 : 14);
  const shadow = isSelected
    ? `drop-shadow(0 0 5px ${color}80)`
    : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))';

  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg" style="filter:${shadow}">
    <circle cx="21" cy="21" r="19" fill="white" stroke="${color}" stroke-width="${strokeW}"/>
    <text x="21" y="27" text-anchor="middle" font-size="${fontSize}" font-weight="700"
      font-family="system-ui,-apple-system,sans-serif" fill="${color}">${count}</text>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

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
