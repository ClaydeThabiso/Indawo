import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import LocationTracker from "../components/locationTracker";
import BusinessCard from "../components/BusinessCard";
import BusinessMap from "../components/BusinessMap";
import BusinessReviewPanel from "../components/BusinesssReviewPanel";

const SORT_OPTIONS = [
  { value: "nearest", label: "Nearest" },
  { value: "rating", label: "Top rated" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "A to Z" },
];

const RADIUS_OPTIONS = [
  { value: "5", label: "5 km" },
  { value: "10", label: "10 km" },
  { value: "20", label: "20 km" },
  { value: "50", label: "50 km" },
  { value: "any", label: "Anywhere" },
];

// Straight-line (Haversine) distance in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const nums = [lat1, lon1, lat2, lon2].map(Number);
  if (nums.some((n) => !Number.isFinite(n))) return null;
  const [a1, o1, a2, o2] = nums;
  const R = 6371;
  const dLat = (a2 - a1) * (Math.PI / 180);
  const dLon = (o2 - o1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a1 * (Math.PI / 180)) *
      Math.cos(a2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

function Map() {
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Discovery controls
  const [view, setView] = useState("list"); // "list" | "map"
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("nearest");
  const [radius, setRadius] = useState("20");

  // Review panel
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [isReviewPanelOpen, setIsReviewPanelOpen] = useState(false);

  const handleBusinessClick = (biz) => {
    setSelectedBusiness(biz);
    setIsReviewPanelOpen(true);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [bizRes, catRes] = await Promise.all([
          axios.get("http://localhost:5000/api/business/getBusiness", { withCredentials: true }),
          axios.get("http://localhost:5000/api/business/categories"),
        ]);
        setBusinesses(bizRes.data);
        setCategories(catRes.data);
      } catch (err) {
        console.error("Error while fetching businesses:", err);
        setError("Could not load businesses in your area.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const hasLocation = Boolean(userLocation);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = businesses.map((biz) => ({
      ...biz,
      distance: userLocation
        ? calculateDistance(userLocation.lat, userLocation.lng, biz.lat, biz.lng)
        : null,
    }));

    // Radius only applies once we know where the user is
    if (userLocation && radius !== "any") {
      const max = Number(radius);
      list = list.filter((b) => b.distance !== null && b.distance <= max);
    }

    if (selectedCategory !== "All") {
      list = list.filter((b) => b.category_name === selectedCategory);
    }

    if (q) {
      list = list.filter((b) =>
        [b.business_name, b.description, b.address_name, b.category_name].some((field) =>
          (field || "").toLowerCase().includes(q),
        ),
      );
    }

    const byName = (a, b) => (a.business_name || "").localeCompare(b.business_name || "");

    list.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (
            Number(b.avg_rating) - Number(a.avg_rating) ||
            Number(b.review_count) - Number(a.review_count) ||
            byName(a, b)
          );
        case "newest":
          return new Date(b.created_at || 0) - new Date(a.created_at || 0) || byName(a, b);
        case "name":
          return byName(a, b);
        case "nearest":
        default:
          // Without a location there is no distance, so fall back to A to Z
          if (a.distance === null || b.distance === null) return byName(a, b);
          return a.distance - b.distance || byName(a, b);
      }
    });

    return list;
  }, [businesses, userLocation, radius, selectedCategory, query, sortBy]);

  const filtersActive =
    query.trim() !== "" || selectedCategory !== "All" || (hasLocation && radius !== "20");

  const clearFilters = () => {
    setQuery("");
    setSelectedCategory("All");
    setRadius("20");
  };

  const categoryNames = ["All", ...categories.map((c) => c.name)];

  return (
    <div className="bg-slate-50 min-h-screen pb-24 relative">
      {/* Header */}
      <div className="px-6 pt-10">
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <Link
            to="/"
            className="text-sm/6 font-bold text-[#1D4A79] hover:text-[#FDBA31] transition-colors"
          >
            Back to home <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
        <h1 className="text-[#1D4A79] text-3xl font-black italic mb-2">Discovery</h1>
        <p className="text-gray-500 text-sm mb-6">Finding unlisted businesses in your area.</p>
        <LocationTracker onLocationFound={(lat, lng) => setUserLocation({ lat, lng })} />
      </div>

      {/* Search + sort + radius */}
      <div className="px-6 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
          <div>
            <label htmlFor="search" className="sr-only">
              Search businesses
            </label>
            <input
              id="search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, street or type of business"
              className="block w-full rounded-lg border-0 py-2.5 px-4 text-gray-900 bg-white ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-[#FDBA31] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:contents">
            <div>
              <label htmlFor="sort" className="sr-only">
                Sort by
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 bg-white ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#FDBA31] text-sm"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    Sort: {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="radius" className="sr-only">
                Distance
              </label>
              <select
                id="radius"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                disabled={!hasLocation}
                className="block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 bg-white ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#FDBA31] text-sm disabled:opacity-50"
              >
                {RADIUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    Within {o.label === "Anywhere" ? "any distance" : o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {!hasLocation && (
          <p className="mt-2 text-xs text-gray-500">
            Allow location access to see distances and filter by how far away a business is.
          </p>
        )}
      </div>

      {/* Category chips */}
      <div className="px-6 mt-4 overflow-x-auto pb-2 hide-scrollbar">
        <div className="flex gap-2 w-max" role="group" aria-label="Filter by category">
          {categoryNames.map((name) => {
            const active = selectedCategory === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedCategory(name)}
                aria-pressed={active}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold border transition-colors ${
                  active
                    ? "bg-[#1D4A79] text-white border-[#1D4A79]"
                    : "bg-white text-[#1D4A79] border-gray-200 hover:border-[#1D4A79]"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results header + view toggle */}
      <div className="px-6 mt-6">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
          <div>
            <h2 className="text-[#1D4A79] font-extrabold text-xl">
              {hasLocation ? "Nearby Businesses" : "Businesses"}
            </h2>
            <p className="text-gray-400 text-sm" aria-live="polite">
              {results.length} {results.length === 1 ? "business" : "businesses"} found
              {filtersActive && (
                <>
                  {" "}
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="font-bold text-[#1D4A79] underline hover:text-[#FDBA31]"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </p>
          </div>

          <div
            className="inline-flex rounded-lg bg-white p-1 ring-1 ring-gray-200"
            role="group"
            aria-label="Choose view"
          >
            {["list", "map"].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`px-4 py-1.5 rounded-md text-sm font-bold capitalize transition-colors ${
                  view === v ? "bg-[#1D4A79] text-white" : "text-[#1D4A79] hover:bg-gray-100"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-center text-sm font-bold border border-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1D4A79]"></div>
          </div>
        ) : view === "map" ? (
          <>
            <BusinessMap
              businesses={results}
              userLocation={userLocation}
              onSelect={handleBusinessClick}
            />
            {results.length === 0 && (
              <p className="mt-4 text-center text-sm text-gray-500">
                Nothing matches these filters yet. Try a wider distance or a different search.
              </p>
            )}
          </>
        ) : results.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center">
            <p className="text-[#1D4A79] font-bold">No businesses match</p>
            <p className="text-gray-500 text-sm mt-1">
              Try a wider distance, a different category, or a shorter search.
            </p>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-md bg-[#FDBA31] px-4 py-2 text-sm font-bold text-[#1D4A79] hover:bg-yellow-400"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((biz) => (
              <div
                key={biz.id}
                onClick={() => handleBusinessClick(biz)}
                className="cursor-pointer transform transition hover:-translate-y-1"
              >
                <BusinessCard
                  business={{
                    id: biz.id,
                    name: biz.business_name,
                    description: biz.description,
                    category: biz.category_name,
                    distance: biz.distance,
                    rating: Number(biz.avg_rating) || 0,
                    reviewCount: Number(biz.review_count) || 0,
                    imageUrl: biz.image_url,
                    lat: biz.lat,
                    lng: biz.lng,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <BusinessReviewPanel
        business={selectedBusiness}
        isOpen={isReviewPanelOpen}
        onClose={() => setIsReviewPanelOpen(false)}
      />
    </div>
  );
}

export default Map;
