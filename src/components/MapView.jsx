import { useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvent } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { DEPARTMENTS, SPORT_GROUPS } from '../data/events.js';
import { createSportMarker, createClusterMarker } from './SportMarker.js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapController({ activeDepartment, userCoords, onBoundsChange }) {
  const map = useMap();

  const reportBounds = useCallback(() => {
    onBoundsChange(map.getBounds());
  }, [map, onBoundsChange]);

  useMapEvent('moveend', reportBounds);
  useMapEvent('zoomend', reportBounds);

  useEffect(() => { reportBounds(); }, [reportBounds]);
  useEffect(() => {
    const dept = DEPARTMENTS[activeDepartment];
    if (dept) map.flyTo(dept.center, dept.zoom, { duration: 1 });
  }, [activeDepartment, map]);
  useEffect(() => {
    if (userCoords) map.flyTo([userCoords.lat, userCoords.lng], 13, { duration: 1.2 });
  }, [userCoords, map]);

  return null;
}

export default function MapView({ events, selectedEventId, onMarkerClick, activeDepartment, userCoords, onBoundsChange }) {
  const dept = DEPARTMENTS[activeDepartment] ?? DEPARTMENTS.finistere;

  // Grouper les événements par coordonnées exactes
  const groups = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      const key = `${e.lat},${e.lng}`;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return Object.values(map);
  }, [events]);

  return (
    <div className="flex-1 min-h-0">
      <MapContainer
        center={dept.center}
        zoom={dept.zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController activeDepartment={activeDepartment} userCoords={userCoords} onBoundsChange={onBoundsChange} />

        {groups.map((group) => {
          const pos = [group[0].lat, group[0].lng];
          const groupKey = `${group[0].lat},${group[0].lng}`;
          const isGroupSelected = group.some((e) => e.id === selectedEventId);

          if (group.length === 1) {
            const event = group[0];
            return (
              <Marker
                key={event.id}
                position={pos}
                icon={createSportMarker(event.sportGroup, event.id === selectedEventId)}
                eventHandlers={{ click: () => onMarkerClick(event.id) }}
              >
                <Popup>
                  <div className="text-sm min-w-[180px]">
                    <div className="font-bold text-gray-800">{event.title}</div>
                    <div className="text-xs font-medium mt-1 px-2 py-0.5 rounded-full inline-block text-white"
                      style={{ backgroundColor: SPORT_GROUPS[event.sportGroup]?.color }}>
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
            );
          }

          // Cluster : plusieurs événements au même endroit
          const allSameSport = group.every((e) => e.sportGroup === group[0].sportGroup);
          const clusterColor = allSameSport
            ? (SPORT_GROUPS[group[0].sportGroup]?.color ?? '#64748b')
            : '#64748b';

          return (
            <Marker
              key={`cluster-${groupKey}`}
              position={pos}
              icon={createClusterMarker(group.length, clusterColor, isGroupSelected)}
            >
              <Popup minWidth={200}>
                <div className="text-sm">
                  <div className="font-bold text-gray-700 mb-2 text-xs uppercase tracking-wide">
                    {group.length} événements à cet endroit
                  </div>
                  {group.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onMarkerClick(event.id)}
                      className="flex items-center gap-2 py-1.5 px-1 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ borderLeft: `3px solid ${SPORT_GROUPS[event.sportGroup]?.color}`, paddingLeft: '8px', marginBottom: '2px' }}
                    >
                      <div>
                        <div className="font-medium text-gray-800 text-xs leading-tight">{event.title}</div>
                        <div className="text-gray-400 text-[11px]">
                          {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          {' · '}{new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Popup>
            </Marker>
          );
        })}

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
