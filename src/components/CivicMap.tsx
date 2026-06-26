import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { IssuePost } from '../types';

interface CivicMapProps {
  issues: IssuePost[];
  onSelectIssue?: (issue: IssuePost) => void;
  selectedIssue: IssuePost | null;
}

export const CivicMap: React.FC<CivicMapProps> = ({
  issues,
  onSelectIssue,
  selectedIssue,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});

  const [userLocation, setUserLocation] = useState<[number, number]>([
    21.2514,
    81.6296,
  ]);

  // Get user's location
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation([coords.latitude, coords.longitude]);
      },
      () => {
        console.log("Location permission denied. Using Raipur as fallback.");
      }
    );
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center: userLocation, // Centered in San Francisco
      zoom: 12.5,
      zoomControl: true,
      attributionControl: false,
    });

    // Clean, high-contrast dark-mode or light-mode tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when issues list changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    const userIcon = L.divIcon({
  html: `
    <div class="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow"></div>
  `,
  className: "",
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const userMarker = L.marker(userLocation, {
  icon: userIcon,
})
  .addTo(map)
  .bindPopup("You are here");

    markersRef.current["user-location"] = userMarker;

    issues.forEach((issue) => {
      if (issue.latitude === undefined || issue.longitude === undefined) return;

      // Color coding based on severity
      let colorClass = 'bg-slate-500';
      let pingClass = 'bg-slate-400';
      if (issue.severity === 'critical') {
        colorClass = 'bg-red-600';
        pingClass = 'bg-red-500';
      } else if (issue.severity === 'high') {
        colorClass = 'bg-orange-500';
        pingClass = 'bg-orange-400';
      } else if (issue.severity === 'medium') {
        colorClass = 'bg-yellow-500';
        pingClass = 'bg-yellow-400';
      } else if (issue.severity === 'low') {
        colorClass = 'bg-emerald-500';
        pingClass = 'bg-emerald-400';
      }

      // If status is resolved, make it dim/emerald
      if (issue.status === 'resolved') {
        colorClass = 'bg-slate-400 border-emerald-400 border-2';
        pingClass = 'bg-emerald-100';
      }

      // Custom DivIcon marker
      const markerHtml = `
        <div class="relative flex items-center justify-center w-6 h-6">
          <span class="animate-ping absolute inline-flex h-5 w-5 rounded-full ${pingClass} opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3.5 w-3.5 ${colorClass} shadow-md border-white border"></span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-div-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([issue.latitude, issue.longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div class="font-sans text-xs p-1.5 space-y-1">
            <div class="font-black text-slate-900">${issue.title}</div>
            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">${issue.category}</div>
            <div class="flex items-center gap-1 mt-1">
              <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                issue.status === 'resolved' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : issue.status === 'in_progress' 
                    ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                    : 'bg-slate-100 text-slate-800 border border-slate-200'
              }">${issue.status}</span>
              <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-50 text-red-800 border border-red-200">${issue.severity}</span>
            </div>
          </div>
        `, { closeButton: false, offset: [0, -5] });

      // Click on marker action
      marker.on('click', () => {
        if (onSelectIssue) {
          onSelectIssue(issue);
        }
      });

      markersRef.current[issue.id] = marker;
    });

    // Auto-fit bounds if we have markers
    if (issues.length > 0) {
      const group = L.featureGroup(Object.values(markersRef.current));
      map.fitBounds(group.getBounds().pad(0.15), { maxZoom: 14 });
    }
  }, [issues, userLocation]);

  // Handle flyTo when an issue is selected externally
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedIssue) return;

    const { latitude, longitude, id } = selectedIssue;
    if (latitude !== undefined && longitude !== undefined) {
      map.flyTo([latitude, longitude], 14.5, {
        animate: true,
        duration: 1.2,
      });

      // Open popup for selected issue
      const marker = markersRef.current[id];
      if (marker) {
        setTimeout(() => marker.openPopup(), 1200);
      }
    }
  }, [selectedIssue]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col relative" id="civic-map-container">
      {/* Map Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <h4 className="font-bold text-slate-800 text-sm tracking-tight">Interactive Infrastructure Map</h4>
          <p className="text-[10px] text-slate-400">Pulsing pins indicate reported issues and severity level.</p>
        </div>
      </div>

      {/* Leaflet Canvas */}
      <div ref={mapContainerRef} className="flex-1 h-full min-h-[300px] z-10" id="leaflet-map-canvas" />

      {/* Map Legends */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm z-20 flex gap-2.5 text-[9px] font-bold text-slate-600">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-600" />
          <span>Critical</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-slate-400 border border-emerald-400" />
          <span>Resolved</span>
        </div>
      </div>
    </div>
  );
};
