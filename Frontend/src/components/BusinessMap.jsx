import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Johannesburg, used only until real businesses or the user's location arrive
const DEFAULT_CENTER = [-26.2041, 28.0473];

// Brand-coloured pin drawn inline, so no marker image files are needed
// (Leaflet's default icon paths break under most bundlers).
const pinIcon = L.divIcon({
  className: "",
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  tooltipAnchor: [0, -30],
  html: `<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M14 0C6.3 0 0 6.1 0 13.7 0 24 14 36 14 36s14-12 14-22.3C28 6.1 21.7 0 14 0z" fill="#1D4A79"/>
    <circle cx="14" cy="13.5" r="5.5" fill="#FDBA31"/>
  </svg>`,
});

export default function BusinessMap({
  businesses,
  userLocation,
  onSelect,
  heightClass = "h-[60vh] min-h-[320px]",
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const clusterRef = useRef(null);
  const userMarkerRef = useRef(null);
  const onSelectRef = useRef(onSelect);

  // Keep the latest click handler without rebuilding every marker
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Create the map once
  useEffect(() => {
    const map = L.map(containerRef.current).setView(DEFAULT_CENTER, 11);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
    });
    map.addLayer(cluster);

    mapRef.current = map;
    clusterRef.current = cluster;

    return () => {
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
      userMarkerRef.current = null;
    };
  }, []);

  // Redraw markers whenever the filtered list changes
  useEffect(() => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster) return;

    cluster.clearLayers();

    const markers = businesses
      .filter((b) => Number.isFinite(Number(b.lat)) && Number.isFinite(Number(b.lng)))
      .map((b) => {
        const marker = L.marker([Number(b.lat), Number(b.lng)], {
          icon: pinIcon,
          title: b.business_name, // plain attribute, safe
          keyboard: true,
        });

        // Business names are user-submitted, so build the tooltip from a text
        // node instead of an HTML string.
        const label = document.createElement("span");
        label.textContent = b.business_name;
        marker.bindTooltip(label, { direction: "top" });

        marker.on("click", () => onSelectRef.current?.(b));
        return marker;
      });

    cluster.addLayers(markers);

    if (markers.length > 0) {
      map.fitBounds(cluster.getBounds().pad(0.15), { maxZoom: 16 });
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13);
    }
    // userLocation is intentionally not a dependency: moving the dot should
    // not re-fit the map. The effect below handles the dot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businesses]);

  // Blue dot for the user's own position
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }
    userMarkerRef.current = L.circleMarker([userLocation.lat, userLocation.lng], {
      radius: 8,
      color: "#ffffff",
      weight: 3,
      fillColor: "#2563EB",
      fillOpacity: 1,
    })
      .bindTooltip("You are here", { direction: "top" })
      .addTo(map);
  }, [userLocation]);

  const centerOnUser = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 15);
    }
  };

  return (
    // relative + z-0 keeps Leaflet's internal z-indexes below the review panel
    <div className="relative z-0 rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
      <div
        ref={containerRef}
        className={`${heightClass} w-full`}
        role="region"
        aria-label="Map of nearby businesses"
      />
      {userLocation && (
        <button
          type="button"
          onClick={centerOnUser}
          className="absolute bottom-4 right-4 z-[500] bg-white text-[#1D4A79] font-bold text-xs px-3 py-2 rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FDBA31]"
        >
          Center on me
        </button>
      )}
    </div>
  );
}
