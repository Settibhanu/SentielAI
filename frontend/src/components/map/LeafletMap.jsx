import React from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'

// Default center: Bangalore
const BANGALORE_CENTER = [12.9716, 77.5946]

/**
 * LeafletMap — base map wrapper.
 * Children (ZoneLayer, AccidentMarkers, etc.) are rendered inside the map context.
 */
export default function LeafletMap({ children, center = BANGALORE_CENTER, zoom = 12 }) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  )
}
