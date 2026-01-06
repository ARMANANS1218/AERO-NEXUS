import React, { useEffect, useState, useCallback, useContext, useRef } from 'react';
import {
  useCreateOrgLocationRequestMutation,
  useGetOrgLocationRequestsQuery,
  useGetOrgAllowedLocationsQuery,
  useGenerateLocationAccessLinkMutation
} from '../../../features/admin/adminApi';
import { FourSquare } from 'react-loading-indicators';
import ColorModeContext from '../../../context/ColorModeContext';
import { toast } from 'react-toastify';

// NOTE: Defer loading Google Maps API via script tag for simplicity (can be optimized later)
// Try multiple fallbacks in case env wasn't injected properly
const GOOGLE_MAPS_API_KEY =
  import.meta.env?.VITE_GOOGLE_MAPS_KEY ||
  (typeof __GOOGLE_MAPS_KEY__ !== 'undefined' ? __GOOGLE_MAPS_KEY__ : '') ||
  '';
console.debug(
  '[LocationAccess] GOOGLE_MAPS_API_KEY length:',
  GOOGLE_MAPS_API_KEY ? GOOGLE_MAPS_API_KEY.length : 'EMPTY'
);

const LocationAccess = () => {
  const { mode } = useContext(ColorModeContext);
  const isDark = mode === 'dark';

  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [circle, setCircle] = useState(null);
  const [myMarker, setMyMarker] = useState(null);
  const [myCircle, setMyCircle] = useState(null);
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [radius, setRadius] = useState(100);
  const [reason, setReason] = useState('');
  const [requestType, setRequestType] = useState('permanent');
  const [emergency, setEmergency] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [address, setAddress] = useState('');
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const searchInputRef = useRef(null);
  // Geolocation refinement watchers
  const geoWatchRef = useRef(null);
  const geoWatchTimeoutRef = useRef(null);
  const bestAccuracyRef = useRef(Number.POSITIVE_INFINITY);

  const {
    data: requestsData,
    isLoading: requestsLoading,
    refetch: refetchRequests,
  } = useGetOrgLocationRequestsQuery();
  const {
    data: allowedData,
    isLoading: allowedLoading,
    refetch: refetchAllowed,
  } = useGetOrgAllowedLocationsQuery();
  const [createRequest] = useCreateOrgLocationRequestMutation();
  const [generateLink, { isLoading: generatingLink }] = useGenerateLocationAccessLinkMutation();

  // Link Generation State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkClientName, setLinkClientName] = useState('');
  const [linkExpiry, setLinkExpiry] = useState(30);
  const [generatedLink, setGeneratedLink] = useState('');

  const handleGenerateLink = async () => {
    try {
      const resp = await generateLink({
        clientName: linkClientName,
        expiresInMinutes: linkExpiry,
      }).unwrap();
      setGeneratedLink(resp.data.link);
      toast.success('Link generated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate link');
    }
  };

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success('Link copied to clipboard');
    }
  };

  // Load Google Maps script
  useEffect(() => {
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }
    if (!GOOGLE_MAPS_API_KEY) {
      toast.error('Google Maps API key not configured. Please set VITE_GOOGLE_MAPS_KEY in .env');
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => toast.error('Failed to load Google Maps');
    document.head.appendChild(script);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || map) return;
    const initialCenter = { lat: 28.6139, lng: 77.209 }; // Default: New Delhi
    const m = new window.google.maps.Map(document.getElementById('org-location-map'), {
      center: initialCenter,
      zoom: 14,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      styles: isDark
        ? [
            { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
          ]
        : [],
    });
    setMap(m);
  }, [mapLoaded, isDark, map]);

  // Geolocation to center map
  useEffect(() => {
    if (!map) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        map.setCenter({ lat: latitude, lng: longitude });
      });
    }
  }, [map]);

  // Handle map click
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setSelection(lat, lng);
    });
    return () => window.google.maps.event.removeListener(listener);
  }, [map, marker, circle, radius]);

  // Update circle radius when radius changes
  useEffect(() => {
    if (circle && coords.lat && coords.lng) {
      circle.setRadius(radius);
    }
  }, [radius, circle, coords]);

  // Reverse geocode helper (define BEFORE setSelection to avoid TDZ issues)
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      setGeocodeLoading(true);
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const json = await res.json();
      if (json.status === 'OK' && json.results?.length) {
        setAddress(json.results[0].formatted_address);
      } else {
        setAddress('');
      }
    } catch (err) {
      console.error('Reverse geocode failed', err);
    } finally {
      setGeocodeLoading(false);
    }
  }, []);

  // Helper: set marker, circle, coords, address
  const setSelection = useCallback(
    (lat, lng, opts = {}) => {
      try {
        setCoords({ lat, lng });
        // Marker
        if (marker) marker.setMap(null);
        const mk = new window.google.maps.Marker({ position: { lat, lng }, map });
        setMarker(mk);
        // Circle
        if (circle) circle.setMap(null);
        const c = new window.google.maps.Circle({
          map,
          center: { lat, lng },
          radius: radius,
          strokeColor: '#2563eb',
          strokeOpacity: 0.9,
          strokeWeight: 2,
          fillColor: '#3b82f6',
          fillOpacity: 0.15,
        });
        setCircle(c);
        // Center map optionally
        if (opts.center !== false) {
          map?.setCenter({ lat, lng });
        }
        // If address is provided (from Places), use it; otherwise reverse geocode
        if (opts.address) {
          setAddress(opts.address);
        } else {
          reverseGeocode(lat, lng);
        }
      } catch (e) {
        console.error('Failed to set selection', e);
      }
    },
    [map, marker, circle, radius, reverseGeocode]
  );

  // Helper: show my location marker + selectable blue circle (click to select center)
  const setMyLocation = useCallback(
    (lat, lng, accuracy = 0) => {
      try {
        if (!map) return;
        // Create/update my location marker (blue dot with white ring)
        const icon = {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#1d4ed8',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        };
        if (myMarker) myMarker.setMap(null);
        const mk = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          icon,
          zIndex: 9999,
          clickable: true,
          title: 'My location',
        });
        // Clicking the dot selects this point
        mk.addListener('click', () => {
          setSelection(lat, lng, { center: true });
        });
        setMyMarker(mk);

        // Small selectable blue circle around my location (not accuracy, just a clickable target)
        if (myCircle) myCircle.setMap(null);
        const selectCircle = new window.google.maps.Circle({
          map,
          center: { lat, lng },
          radius: 25,
          strokeColor: '#2563eb',
          strokeOpacity: 0.9,
          strokeWeight: 2,
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          zIndex: 9998,
          clickable: true,
        });
        selectCircle.addListener('click', () => {
          setSelection(lat, lng, { center: true });
        });
        setMyCircle(selectCircle);
      } catch (e) {
        console.error('Failed to set my location', e);
      }
    },
    [map, myMarker, myCircle, setSelection]
  );

  // Locate Me handler (recenters map and shows a distinct current-location marker)
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.');
      return;
    }
    // Clear any previous watch
    if (geoWatchRef.current) {
      try {
        navigator.geolocation.clearWatch(geoWatchRef.current);
      } catch (_) {}
      geoWatchRef.current = null;
    }
    if (geoWatchTimeoutRef.current) {
      clearTimeout(geoWatchTimeoutRef.current);
      geoWatchTimeoutRef.current = null;
    }
    bestAccuracyRef.current = Number.POSITIVE_INFINITY;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setMyLocation(latitude, longitude, accuracy);
        map?.setCenter({ lat: latitude, lng: longitude });
        // Improve visibility by zooming closer if needed
        const currentZoom = map?.getZoom?.() || 14;
        if (currentZoom < 17) map.setZoom(17);
        // Start a short watch to refine accuracy, then stop automatically
        try {
          geoWatchRef.current = navigator.geolocation.watchPosition(
            (p) => {
              const { latitude: lat2, longitude: lng2, accuracy: acc2 } = p.coords;
              // Update only if accuracy improved
              if (acc2 && acc2 < bestAccuracyRef.current) {
                bestAccuracyRef.current = acc2;
                setMyLocation(lat2, lng2, acc2);
                map?.setCenter({ lat: lat2, lng: lng2 });
              }
              // Stop early if accuracy is strong
              if (acc2 && acc2 <= 25 && geoWatchRef.current) {
                try {
                  navigator.geolocation.clearWatch(geoWatchRef.current);
                } catch (_) {}
                geoWatchRef.current = null;
                if (geoWatchTimeoutRef.current) {
                  clearTimeout(geoWatchTimeoutRef.current);
                  geoWatchTimeoutRef.current = null;
                }
              }
            },
            (err) => {
              console.warn('watchPosition error', err);
            },
            { enableHighAccuracy: true, maximumAge: 0 }
          );
          // Hard stop after 10 seconds
          geoWatchTimeoutRef.current = setTimeout(() => {
            if (geoWatchRef.current) {
              try {
                navigator.geolocation.clearWatch(geoWatchRef.current);
              } catch (_) {}
              geoWatchRef.current = null;
            }
            if (geoWatchTimeoutRef.current) {
              clearTimeout(geoWatchTimeoutRef.current);
              geoWatchTimeoutRef.current = null;
            }
          }, 10000);
        } catch (e) {
          console.warn('Failed to start watchPosition', e);
        }
      },
      (err) => {
        console.error('Geolocation error', err);
        toast.error('Unable to get your location. Please allow location access.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [map, setMyLocation]);

  // Cleanup any active geolocation watch on unmount
  useEffect(() => {
    return () => {
      if (geoWatchRef.current) {
        try {
          navigator.geolocation.clearWatch(geoWatchRef.current);
        } catch (_) {}
        geoWatchRef.current = null;
      }
      if (geoWatchTimeoutRef.current) {
        clearTimeout(geoWatchTimeoutRef.current);
        geoWatchTimeoutRef.current = null;
      }
    };
  }, []);

  // Setup Places Autocomplete on search box
  useEffect(() => {
    if (!map || !window.google?.maps?.places || !searchInputRef.current) return;
    const input = searchInputRef.current;
    const ac = new window.google.maps.places.Autocomplete(input, {
      fields: ['formatted_address', 'geometry', 'name'],
      types: ['geocode'],
    });
    const listener = ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place || !place.geometry || !place.geometry.location) {
        toast.error('No details available for the selected location');
        return;
      }
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const addr = place.formatted_address || place.name;
      setSelection(lat, lng, { center: true, address: addr });
    });
    return () => listener?.remove?.();
  }, [map, setSelection]);

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!coords.lat || !coords.lng) {
      toast.error('Please select a location on the map');
      return;
    }
    if (!reason.trim()) {
      toast.error('Reason is required');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        latitude: coords.lat,
        longitude: coords.lng,
        address,
        reason: reason.trim(),
        radius,
        requestType,
        emergency,
      };
      const resp = await createRequest(body).unwrap();
      toast.success(resp.message || 'Request submitted');
      setReason('');
      setEmergency(false);
      refetchRequests();
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRequests = () => {
    const items = requestsData?.data?.items || [];
    if (requestsLoading) return <div className="text-sm text-gray-500">Loading requests...</div>;
    if (!items.length) return <div className="text-sm text-gray-500">No requests yet</div>;
    return (
      <div className="space-y-3">
        {items.map((r) => (
          <div
            key={r._id}
            className="p-3 rounded border bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold">{r.address || 'Selected Location'}</p>
                <p className="text-xs text-gray-500">Reason: {r.reason}</p>
                <p className="text-xs text-gray-500">
                  Radius: {r.requestedRadius}m • Type: {r.requestType}{' '}
                  {r.emergency && '• Emergency'}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded font-medium ${
                  r.status === 'pending'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200'
                    : r.status === 'approved'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                    : r.status === 'rejected'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-950 dark:text-gray-300'
                }`}
              >
                {r.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAllowed = () => {
    const items = allowedData?.data || [];
    if (allowedLoading)
      return <div className="text-sm text-gray-500">Loading approved locations...</div>;
    if (!items.length)
      return <div className="text-sm text-gray-500">No active approved locations</div>;
    return (
      <div className="space-y-3">
        {items.map((loc) => (
          <div
            key={loc._id}
            className="p-3 rounded border bg-white dark:bg-slate-800 dark:border-slate-700"
          >
            <p className="text-sm font-semibold">
              {loc.address || loc.label || 'Approved Location'}
            </p>
            <p className="text-xs text-gray-500">
              Radius: {loc.radiusMeters}m • Type: {loc.type}
            </p>
            {loc.type === 'temporary' && (
              <p className="text-xs text-gray-500">
                Valid: {loc.startAt ? new Date(loc.startAt).toLocaleString() : 'N/A'} →{' '}
                {loc.endAt ? new Date(loc.endAt).toLocaleString() : 'N/A'}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 p-3">
      <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Organization Login Location Access
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl mt-1">
              Select a point on the map and submit a request for SuperAdmin approval. Once approved,
              employees (Admin, Agent, QA, TL) will be restricted to login within the approved
              radius.
            </p>
          </div>
          <button
            onClick={() => {
              setShowLinkModal(true);
              setGeneratedLink('');
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded shadow-sm flex items-center gap-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            Generate location access link
          </button>
        </div>
      </div>

      {/* Map & Request Form */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div
            id="org-location-map"
            className="relative w-full h-[420px] rounded-lg border border-gray-300 dark:border-slate-700 overflow-hidden bg-gray-50 dark:bg-slate-800 flex items-center justify-center"
          >
            {!mapLoaded && (
              <div className="flex flex-col items-center gap-3">
                <FourSquare
                  color={isDark ? '#ffffff' : '#202220'}
                  size="large"
                  text=""
                  textColor=""
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Loading map...</p>
              </div>
            )}
            {/* Search box overlay */}
            <div className="absolute top-3 left-3 right-28 z-10">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search location..."
                className="w-full max-w-md px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600 bg-white/90 dark:bg-slate-900/80 text-sm text-gray-800 dark:text-gray-100 shadow"
              />
            </div>
          </div>
          {/* Controls below the map */}
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={handleLocateMe}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 2v3"></path>
                <path d="M12 19v3"></path>
                <path d="M2 12h3"></path>
                <path d="M19 12h3"></path>
              </svg>
              Locate me
            </button>
          </div>
        </div>
        <div className="space-y-4">
          <form
            onSubmit={submitRequest}
            className="space-y-4 rounded-lg border border-gray-200 dark:border-slate-700 p-2 bg-white dark:bg-slate-900"
          >
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Selected Coordinates
              </label>
              <p className="text-xs mt-1 font-mono text-gray-800 dark:text-gray-200">
                {coords.lat ? coords.lat.toFixed(5) : '--'},{' '}
                {coords.lng ? coords.lng.toFixed(5) : '--'}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Address (auto-filled)
              </label>
              <p className="text-xs mt-1 min-h-[32px] text-gray-800 dark:text-gray-200">
                {geocodeLoading ? 'Resolving address...' : address || 'Click on map to select'}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Reason *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm p-2 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Describe why this location should be approved"
              ></textarea>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Radius (meters)
                </label>
                <input
                  type="number"
                  min={10}
                  max={1000}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="mt-1 w-full rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Type</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="permanent">Permanent</option>
                  <option value="temporary">Temporary</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="emergency"
                checked={emergency}
                onChange={(e) => setEmergency(e.target.checked)}
              />
              <label htmlFor="emergency" className="text-xs text-gray-600 dark:text-gray-300">
                Emergency (prioritize review)
              </label>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? 'Submitting...' : 'Submit Location Request'}
            </button>
          </form>
        </div>
      </div>

      {/* Unified Requests + Approved Locations */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
          Location Requests & Approved Zones
        </h3>
        {renderRequests()}
      </div>

      {/* Link Generation Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-slate-700">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Generate Client Access Link
              </h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {!generatedLink ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Client Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={linkClientName}
                      onChange={(e) => setLinkClientName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Link Expiry
                    </label>
                    <select
                      value={linkExpiry}
                      onChange={(e) => setLinkExpiry(Number(e.target.value))}
                      className="w-full rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={30}>30 Minutes</option>
                      <option value={60}>1 Hour</option>
                      <option value={120}>2 Hours</option>
                      <option value={1440}>24 Hours</option>
                    </select>
                  </div>
                  <button
                    onClick={handleGenerateLink}
                    disabled={generatingLink}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium disabled:opacity-50"
                  >
                    {generatingLink ? 'Generating...' : 'Generate Link'}
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-center">
                    <p className="text-green-800 dark:text-green-300 font-medium">
                      Link Generated Successfully!
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Expires in {linkExpiry} minutes
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Share this link with the client
                    </label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={generatedLink}
                        className="flex-1 rounded border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 p-2 text-sm text-gray-600 dark:text-gray-300"
                      />
                      <button
                        onClick={copyLink}
                        className="px-3 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded text-gray-700 dark:text-gray-200"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setGeneratedLink('');
                      setLinkClientName('');
                    }}
                    className="w-full py-2 text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                  >
                    Generate Another Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationAccess;
