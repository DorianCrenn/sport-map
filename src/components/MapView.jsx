import { useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvent } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import L from 'leaflet';
import { DEPARTMENTS, SPORTS } from '../data/events.js';
import { createSportMarker, createClusterMarker } from './SportMarker.js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapController({ activeDepartment, userCoords, onBoundsChange, selectedEvent, onMapClick }) {
  const map = useMap();

  const reportBounds = useCallback(() => {
    onBoundsChange(map.getBounds());
  }, [map, onBoundsChange]);

  useMapEvent('moveend', reportBounds);
  useMapEvent('zoomend', reportBounds);
  useMapEvent('click', () => { onMapClick?.(); });

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

export default function MapView({ events, selectedEventId, onMarkerClick, activeDepartment, userCoords, onBoundsChange, selectedEvent, onMapClick, isFavorite }) {
  const dept = DEPARTMENTS[activeDepartment] ?? DEPARTMENTS.finistere;

  function clusterIcon(cluster) {
    const count = cluster.getChildCount();
    // title est stocké dans options.title par Leaflet — on l'utilise pour le sport
    const markers = cluster.getAllChildMarkers();
    const sports = markers.map((m) => m.options.title).filter(Boolean);
    const allSame = sports.length > 0 && sports.every((s) => s === sports[0]);
    const color = allSame ? (SPORTS[sports[0]]?.color ?? '#64748b') : '#64748b';
    const emoji = allSame ? (SPORTS[sports[0]]?.emoji ?? null) : null;
    return createClusterMarker(count, color, emoji);
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
          onMapClick={onMapClick}
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
              icon={createSportMarker(event.sport, event.id === selectedEventId, isFavorite?.(event.id))}
              eventHandlers={{ click: () => onMarkerClick(event.id) }}
              title={event.sport}
            />
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
