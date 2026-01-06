import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { FourSquare } from 'react-loading-indicators';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Try multiple fallbacks
const GOOGLE_MAPS_API_KEY =
  import.meta.env?.VITE_GOOGLE_MAPS_KEY ||
  (typeof __GOOGLE_MAPS_KEY__ !== 'undefined' ? __GOOGLE_MAPS_KEY__ : '') ||
  '';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ClientLocationCapture = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Map state
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [circle, setCircle] = useState(null);
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [radius, setRadius] = useState(100);
  const [address, setAddress] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const searchInputRef = useRef(null);

  // 1. Validate Token
  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/location/public/${token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Invalid link');
        }

        setSession(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) validateToken();
  }, [token]);

  // Timer Effect
  useEffect(() => {
    if (!session?.expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(session.expiresAt).getTime();
      const distance = expiry - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft('Expired');
        setError('Link has expired');
      } else {
        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${minutes}m ${seconds}s`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  // 2. Load Google Maps
  useEffect(() => {
    if (loading || error || submitted) return;

    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      setError('Map configuration missing');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => setError('Failed to load maps');
    document.head.appendChild(script);
  }, [loading, error, submitted]);

  // 3. Initialize Map
  useEffect(() => {
    if (!mapLoaded || map) return;

    const initialCenter = { lat: 28.6139, lng: 77.209 }; // Default New Delhi
    const m = new window.google.maps.Map(document.getElementById('client-map'), {
      center: initialCenter,
      zoom: 14,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      zoomControl: true,
      zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
    });
    setMap(m);

    // Try to get user location immediately
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        m.setCenter({ lat: latitude, lng: longitude });
        m.setZoom(16);
      });
    }
  }, [mapLoaded, map]);

  // 4. Map Click Listener
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setSelection(lat, lng);
    });
    return () => window.google.maps.event.removeListener(listener);
  }, [map, marker, circle, radius]);

  // 5. Radius Update
  useEffect(() => {
    if (circle && coords.lat) {
      circle.setRadius(radius);
    }
  }, [radius, circle, coords]);

  // Helper: Reverse Geocode
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

  // Helper: Set Selection
  const setSelection = useCallback(
    (lat, lng, opts = {}) => {
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
        strokeColor: '#4f46e5', // Indigo-600
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#6366f1', // Indigo-500
        fillOpacity: 0.2,
      });
      setCircle(c);

      if (opts.center !== false) {
        map?.setCenter({ lat, lng });
      }

      if (opts.address) {
        setAddress(opts.address);
      } else {
        reverseGeocode(lat, lng);
      }
    },
    [map, marker, circle, radius, reverseGeocode]
  );

  // Locate Me
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setSelection(latitude, longitude, { center: true });
        map?.setZoom(17);
      },
      () => {
        toast.error('Could not get your location');
      }
    );
  };

  // Search Box
  useEffect(() => {
    if (!map || !window.google?.maps?.places || !searchInputRef.current) return;
    const ac = new window.google.maps.places.Autocomplete(searchInputRef.current, {
      fields: ['formatted_address', 'geometry', 'name'],
      types: ['geocode'],
    });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place.geometry) return;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setSelection(lat, lng, { center: true, address: place.formatted_address || place.name });
    });
  }, [map, setSelection]);

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coords.lat) return toast.error('Please select a location');
    if (!reason.trim()) return toast.error('Please enter a reason/description');

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/location/public/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: coords.lat,
          longitude: coords.lng,
          address,
          radius,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');

      setSubmitted(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FourSquare color="#4f46e5" size="medium" text="" textColor="" />
          <p className="mt-4 text-gray-600 font-medium animate-pulse">Verifying secure link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              ></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Link Expired or Invalid</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <div className="text-xs text-gray-400">
            Please contact your administrator for a new link.
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg
              className="w-10 h-10 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Location Submitted!</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Thank you. Your location request has been securely transmitted to the administrator for
            approval.
          </p>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-500">You can now close this window.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <ToastContainer position="top-center" theme="colored" />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Secure Location Request
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {timeLeft && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full border border-orange-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span className="text-sm font-medium font-mono">{timeLeft}</span>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold max-w-[150px] truncate">
                {session.clientName || 'Client'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col min-h-[calc(100vh-56px)] justify-start">
        {/* Main Content */}
        <main className=" w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col lg:flex-row flex-1">
            {/* Map Section */}
            <div className="relative w-full lg:w-2/3  h-[500px] lg:h-auto bg-gray-100 order-2 lg:order-1">
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500 font-medium">Loading Map...</p>
                  </div>
                </div>
              )}

              <div id="client-map" className="w-full h-full" />

              {/* Search Overlay */}
              <div className="absolute top-4 left-4 right-4 sm:w-96 z-10">
                <div className="relative shadow-lg rounded-xl group">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search for your location..."
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 shadow-sm text-sm transition-all bg-white/90 backdrop-blur-sm focus:bg-white"
                  />
                  <div className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Locate Me Button - UPDATED */}
              <button
                onClick={handleLocateMe}
                className="absolute bottom-6 right-6 bg-white text-indigo-600 px-5 py-3 rounded-full shadow-lg shadow-indigo-900/10 border border-gray-100 hover:bg-indigo-50 hover:scale-105 transition-all duration-200 flex items-center gap-2.5 font-semibold text-sm z-10 group"
              >
                <svg
                  className="w-5 h-5 group-hover:animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                </svg>
                Locate Me
              </button>
            </div>

            {/* Form Section */}
            <div className="w-full lg:w-1/3 h-auto lg:h-auto overflow-y-auto border-l border-gray-100 bg-white flex flex-col order-1 lg:order-2">
              <div className="p-6 lg:p-8 space-y-8 flex-1">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Confirm Location</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Please verify the details below before submitting.
                  </p>
                </div>

                {/* Selected Address Card */}
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 transition-colors hover:border-indigo-100 hover:bg-indigo-50/30">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Selected Address
                  </label>
                  <div className="text-sm text-gray-900 font-medium leading-relaxed min-h-[40px]">
                    {geocodeLoading ? (
                      <div className="flex items-center gap-2 text-indigo-600">
                        <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <span>Fetching address...</span>
                      </div>
                    ) : (
                      address || (
                        <span className="text-gray-400 italic flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
                            ></path>
                          </svg>{' '}
                          Tap on map to select
                        </span>
                      )
                    )}
                  </div>
                  {coords.lat && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 font-mono bg-white px-2 py-1 rounded border border-gray-100 inline-flex">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        ></path>
                      </svg>
                      <span>
                        {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Radius Slider */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-bold text-gray-700">Access Radius</label>
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-bold font-mono">
                      {radius}m
                    </span>
                  </div>
                  <div className="relative h-6 flex items-center">
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      step="10"
                      value={radius}
                      onChange={(e) => setRadius(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Set the allowed login range around this point.
                  </p>
                </div>

                {/* Reason Input */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Location Label / Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm resize-none shadow-sm placeholder-gray-400"
                    placeholder="e.g. Home Office, Remote Workspace..."
                  />
                </div>
              </div>

              {/* Submit Footer */}
              <div className="p-6 lg:p-8 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !coords.lat}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    'Submit Location Request'
                  )}
                </button>
                <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-gray-400">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    ></path>
                  </svg>
                  <span>Secure Location Submission</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClientLocationCapture;
