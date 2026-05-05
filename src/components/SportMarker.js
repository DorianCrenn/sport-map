import L from 'leaflet';
import { SPORT_GROUPS } from '../data/events.js';

function toPastel(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const m = (c) => Math.round(c * 0.28 + 255 * 0.72);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

export function createClusterMarker(count, color = '#64748b') {
  const fill = toPastel(color);
  const size = 36;
  const fontSize = count > 9 ? 11 : 13;

  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 5px rgba(0,0,0,0.18))">
    <circle cx="21" cy="21" r="19" fill="${fill}" stroke="${color}" stroke-width="2.5"/>
    <text x="21" y="26.5" text-anchor="middle" font-size="${fontSize}" font-weight="700"
      font-family="system-ui,-apple-system,sans-serif" fill="${color}">${count}</text>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function createSportMarker(sportGroup, isSelected = false, isFavorite = false) {
  const color = SPORT_GROUPS[sportGroup]?.color ?? '#6b7280';
  const fill = toPastel(color);
  const size = isSelected ? 38 : 30;
  const tipH = isSelected ? 14 : 11;
  const strokeW = isSelected ? 3 : 2.5;
  const dotR = isSelected ? 6 : 4.5;
  const shadow = isSelected
    ? `drop-shadow(0 0 6px ${color}70)`
    : 'drop-shadow(0 2px 3px rgba(0,0,0,0.18))';

  const heartBadge = isFavorite
    ? `<circle cx="27" cy="5.5" r="5.5" fill="white" stroke="#ef4444" stroke-width="1.5"/>
       <text x="27" y="9" text-anchor="middle" font-size="7.5" fill="#ef4444" font-family="system-ui,sans-serif">♥</text>`
    : '';

  const svg = `<svg width="${size}" height="${size + tipH}" viewBox="0 0 36 50" xmlns="http://www.w3.org/2000/svg" style="filter:${shadow}">
    <path d="M18 0 C8.059 0 0 8.059 0 18 C0 31.5 18 50 18 50 C18 50 36 31.5 36 18 C36 8.059 27.941 0 18 0 Z"
      fill="${fill}" stroke="${color}" stroke-width="${strokeW}"/>
    <circle cx="18" cy="17" r="${dotR}" fill="${color}"/>
    ${heartBadge}
  </svg>`;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size + tipH],
    iconAnchor: [size / 2, size + tipH],
    popupAnchor: [0, -(size + tipH)],
  });
}
