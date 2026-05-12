import { useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvent } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import L from 'leaflet';
import { DEPARTMENTS } from '../data/events.js';
import { useSports } from '../hooks/useSports.js';
import { createSportMarker, createClusterMarker } from './SportMarker.js';
import { SPORT_ICONS } from './sportIcons.js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Pulsing user position marker
function makeUserMarker() {
  return L.divIcon({
    html: `
      <div style="position:relative;width:20px;height:20px">
        <div class="geo-ring" style="
          position:absolute;
          inset:-4px;
          background:#3b82f6;
          border-radius:50%;
          opacity:0.45;
        "></div>
        <div style="
          position:absolute;
          inset:0;
          background:#3b82f6;
          border:2.5px solid #fff;
          border-radius:50%;
          box-shadow:0 2px 8px rgba(59,130,246,0.5);
        "></div>
      </div>
    `,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function MapController({ activeDepartment, flyTarget, onBoundsChange, selectedEvent, onMapClick }) {
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

  // flyTarget: { coords: {lat, lng}, zoom }
  useEffect(() => {
    if (flyTarget?.coords) {
      map.flyTo([flyTarget.coords.lat, flyTarget.coords.lng], flyTarget.zoom ?? 13, { duration: 1.3 });
    }
  }, [flyTarget, map]);

  useEffect(() => {
    if (selectedEvent) map.flyTo([selectedEvent.lat, selectedEvent.lng], 14, { duration: 0.8 });
  }, [selectedEvent, map]);

  return null;
}

export default function MapView({
  events, selectedEventId, onMarkerClick, activeDepartment,
  userCoords, flyTarget, onBoundsChange, selectedEvent, onMapClick, isFavorite,
}) {
  const { allSports } = useSports();
  const dept = DEPARTMENTS[activeDepartment] ?? DEPARTMENTS.finistere;
  const userMarkerIcon = makeUserMarker();

  function clusterIcon(cluster) {
    const count = cluster.getChildCount();
    const markers = cluster.getAllChildMarkers();
    const sports = markers.map((m) => m.options.title).filter(Boolean);
    const allSame = sports.length > 0 && sports.every((s) => s === sports[0]);
    const color = allSame ? (allSports[sports[0]]?.color ?? '#64748b') : '#64748b';
    const icon = allSame ? (SPORT_ICONS[sports[0]] ?? null) : null;
    return createClusterMarker(count, color, icon);
  }

  return (
    <div className="flex-1 min-h-0" style={{ position: 'relative', isolation: 'isolate' }}>
      <MapContainer
        center={dept.center}
        zoom={dept.zoom}
        style={{ height: '100%', width: '100%' }}
        preferCanvas={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          keepBuffer={4}
        />
        <MapController
          activeDepartment={activeDepartment}
          flyTarget={flyTarget}
          onBoundsChange={onBoundsChange}
          selectedEvent={selectedEvent}
          onMapClick={onMapClick}
        />

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={clusterIcon}
          maxClusterRadius={52}
          showCoverageOnHover={false}
          spiderfyOnMaxZoom={true}
          disableClusteringAtZoom={16}
          removeOutsideVisibleBounds={true}
          animate={true}
          animateAddingMarkers={false}
        >
          {events.map((event) => (
            <Marker
              key={event.id}
              position={[event.lat, event.lng]}
              icon={createSportMarker(event.sport, event.id === selectedEventId, isFavorite?.(event.id), allSports)}
              eventHandlers={{ click: () => onMarkerClick(event.id) }}
              title={event.sport}
            />
          ))}
        </MarkerClusterGroup>

        {userCoords && (
          <Marker
            position={[userCoords.lat, userCoords.lng]}
            icon={userMarkerIcon}
            zIndexOffset={1000}
          />
        )}
      </MapContainer>
    </div>
  );
}
