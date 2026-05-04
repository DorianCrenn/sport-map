import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { DEPARTMENTS, SPORT_GROUPS } from '../data/events.js';
import { createSportMarker } from './SportMarker.js';

// Fix Leaflet default icon bug with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapController({ activeDepartment, userCoords }) {
  const map = useMap();

  useEffect(() => {
    const dept = DEPARTMENTS[activeDepartment];
    if (dept) {
      map.flyTo(dept.center, dept.zoom, { duration: 1 });
    }
  }, [activeDepartment, map]);

  useEffect(() => {
    if (userCoords) {
      map.flyTo([userCoords.lat, userCoords.lng], 13, { duration: 1.2 });
    }
  }, [userCoords, map]);

  return null;
}

export default function MapView({ events, selectedEventId, onMarkerClick, activeDepartment, userCoords }) {
  const dept = DEPARTMENTS[activeDepartment] ?? DEPARTMENTS.finistere;

  return (
    <div className="flex-1 min-h-0">
      <MapContainer
        center={dept.center}
        zoom={dept.zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController activeDepartment={activeDepartment} userCoords={userCoords} />

        {events.map((event) => (
          <Marker
            key={event.id}
            position={[event.lat, event.lng]}
            icon={createSportMarker(event.sportGroup, event.id === selectedEventId)}
            eventHandlers={{ click: () => onMarkerClick(event.id) }}
          >
            <Popup>
              <div className="text-sm min-w-[180px]">
                <div className="font-bold text-gray-800">{event.title}</div>
                <div
                  className="text-xs font-medium mt-1 px-2 py-0.5 rounded-full inline-block text-white"
                  style={{ backgroundColor: SPORT_GROUPS[event.sportGroup]?.color }}
                >
                  {SPORT_GROUPS[event.sportGroup]?.emoji} {event.sport}
                </div>
                <div className="text-gray-500 mt-1 text-xs">
                  📅 {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {' '}à {new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-gray-500 text-xs">📍 {event.venue}, {event.city}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {userCoords && (
          <Marker
            position={[userCoords.lat, userCoords.lng]}
            icon={L.divIcon({
              html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
              className: '',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
          />
        )}
      </MapContainer>
    </div>
  );
}
