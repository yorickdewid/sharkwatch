import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Robot {
  uid: string;
  name: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  battery: string | null;
}

interface Props {
  robots: Robot[];
  selectedRobot: string | null;
  onSelectRobot: (uid: string) => void;
}

export default function FleetMap({ robots, selectedRobot, onSelectRobot }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map').setView([20, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Add new markers
    robots.forEach(robot => {
      const battery = robot.battery ? parseFloat(robot.battery) : null;
      const batteryPercent = battery ? Math.round(battery * 100) : 0;

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div class="marker ${robot.is_active ? 'active' : 'inactive'} ${selectedRobot === robot.uid ? 'selected' : ''}">
          🦈
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([robot.latitude, robot.longitude], { icon })
        .addTo(mapRef.current!)
        .bindPopup(`
          <div class="popup">
            <strong>${robot.name}</strong><br>
            <span class="uid">UID: ${robot.uid}</span><br>
            ${battery !== null ? `Battery: ${batteryPercent}%` : 'Battery: N/A'}
          </div>
        `);

      marker.on('click', () => onSelectRobot(robot.uid));
      markersRef.current.set(robot.uid, marker);
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();
    };
  }, [robots, selectedRobot, onSelectRobot]);

  return <div id="map" style={{ height: '500px', width: '100%' }}></div>;
}
