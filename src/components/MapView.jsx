import { useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvent } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import L from 'leaflet';
import { DEPARTMENTS, SPORT_GROUPS } from '../data/events.js';
import { createSportMarker, createClusterMarker } from './SportMarker.js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapController({ activeDepartment, userCoords, onBoundsChange, selectedEvent }) {
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
  useEffect(() => {
    if (selectedEvent) map.flyTo([selectedEvent.lat, selectedEvent.lng], 14, { duration: 0.8 });
  }, [selectedEvent, map]);

  return null;
}

export default function MapView({ events, selectedEventId, onMarkerClick, activeDepartment, userCoords, onBoundsChange, selectedEvent }) {
  const dept = DEPARTMENTS[activeDepartment] ?? DEPARTMENTS.finistere;

  function clusterIcon(cluster) {
    const count = cluster.getChildCount();
    // title est stocké dans options.title par Leaflet — on l'utilise pour le sport
    const markers = cluster.getAllChildMarkers();
    const sportGroups = markers.map((m) => m.options.title).filter(Boolean);
    const allSame = sportGroups.length > 0 && sportGroups.every((s) => s === sportGroups[0]);
    const color = allSame ? (SPORT_GROUPS[sportGroups[0]]?.color ?? '#64748b') : '#64748b';
    return createClusterMarker(count, color);
  }

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
        <MapController
          activeDepartment={activeDepartment}
          userCoords={userCoords}
          onBoundsChange={onBoundsChange}
          selectedEvent={selectedEvent}
        />

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={clusterIcon}
          maxClusterRadius={50}
          showCoverageOnHover={false}
          spiderfyOnMaxZoom={true}
          animate={true}
        >
          {events.map((event) => (
            <Marker
              key={event.id}
              position={[event.lat, event.lng]}
              icon={createSportMarker(event.sportGroup, event.id === selectedEventId)}
              eventHandlers={{ click: () => onMarkerClick(event.id) }}
              title={event.sportGroup}
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
        </MarkerClusterGroup>

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
