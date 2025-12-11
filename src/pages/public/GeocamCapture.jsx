import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetPublicSessionQuery, useSubmitPublicCaptureMutation } from '../../features/geocam/geocamApi';
import { toast } from 'react-toastify';
import { Refresh } from '@mui/icons-material';

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY;

export default function GeocamCapture() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { data, error, isLoading, refetch } = useGetPublicSessionQuery(token);
  const [submitCapture, { isLoading: isSubmitting }] = useSubmitPublicCaptureMutation();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [coords, setCoords] = useState(null);
  const [overlayName, setOverlayName] = useState('');
  const [overrideLocationName, setOverrideLocationName] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  const session = data?.data;
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (session?.employeeName) setOverlayName(session.employeeName);
  }, [session]);



  // Start/Stop camera helpers
  const stopCamera = () => {
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } catch (_) {}
  };

  const startCamera = async () => {
    try {
      setIsStartingCamera(true);
      // Check if the site is HTTPS or localhost
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isSecure) {
        toast.error('Camera requires HTTPS. Please access via HTTPS.');
        setIsStartingCamera(false);
        return;
      }

      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      // Stop any existing stream first
      if (stream) stopCamera();

      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        // Ensure play after metadata loads
        const playVideo = () => {
          videoRef.current && videoRef.current.play().catch(err => console.warn('Video play error:', err));
        };
        videoRef.current.onloadedmetadata = playVideo;
        playVideo();
      }
    } catch (e) {
      console.error('Camera error:', e.name, e.message);
      if (e.name === 'NotAllowedError') {
        toast.error('Camera access was denied. Please allow camera permission in browser settings.');
      } else if (e.name === 'NotFoundError') {
        toast.error('No camera device found');
      } else if (e.name === 'NotReadableError') {
        toast.error('Camera is already in use by another application');
      } else {
        toast.error('Camera error: ' + e.message);
      }
    } finally {
      setIsStartingCamera(false);
    }
  };

  useEffect(() => {
    // Start camera on mount
    startCamera();

    // get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        (err) => {
          console.warn('Geolocation error:', err.code, err.message);
          toast.error('Location access denied - ' + (err.code === 1 ? 'Permission denied' : 'Error getting location'));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }

    // detect dark mode from app (tailwind 'dark' class) or system preference
    const checkDark = () => {
      const htmlHasDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(htmlHasDark || prefersDark);
    };
    checkDark();
    const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    const mqHandler = (e) => setIsDark(e.matches || (document.documentElement.classList.contains('dark')));
    mq && mq.addEventListener && mq.addEventListener('change', mqHandler);

    return () => {
      stopCamera();
      mq && mq.removeEventListener && mq.removeEventListener('change', mqHandler);
    };
  }, []);

  const handleRetake = () => {
    // Clear captured image and restart camera
    setImageDataUrl('');
    stopCamera();
    // Small delay to ensure tracks fully stop before restarting
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Capture full frame without cropping
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Add text overlay at bottom
    const ts = new Date().toLocaleString();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, canvas.height - 70, canvas.width, 70);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(overlayName || '', 12, canvas.height - 42);
    ctx.font = '14px sans-serif';
    ctx.fillText(ts, 12, canvas.height - 22);
    if (overrideLocationName) {
      ctx.fillText(overrideLocationName, 12, canvas.height - 6);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setImageDataUrl(dataUrl);
  };



  const submit = async () => {
    if (!imageDataUrl) return toast.error('Capture the photo first');
    try {
      const payload = {
        imageData: imageDataUrl,
        lat: coords?.lat,
        lon: coords?.lon,
        accuracy: coords?.accuracy,
        overlayName,
        overrideLocationName,
      };
      const res = await submitCapture({ token, payload }).unwrap();
      toast.success('Capture submitted');
      navigate('/login');
    } catch (e) {
      toast.error(e?.data?.message || 'Submit failed');
    }
  };

  if (isLoading) return <div className="p-6 text-center text-gray-800 dark:text-gray-200">Loading…</div>;
  if (error) return <div className="p-6 text-center text-red-600 dark:text-red-400">{error?.data?.message || 'Invalid or expired link'}</div>;

  const mapStyle = isDark ? 'dark-matter' : 'osm-carto';
  const mapUrl = coords && GEOAPIFY_KEY
    ? `https://maps.geoapify.com/v1/staticmap?style=${mapStyle}&center=lonlat:${coords.lon},${coords.lat}&zoom=15&marker=lonlat:${coords.lon},${coords.lat};type:material;color:%23ff0000;size:small&width=600&height=300&apiKey=${GEOAPIFY_KEY}`
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Geocam Capture</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">For: <b className="text-gray-900 dark:text-gray-100">{session?.employeeName}</b> ({session?.role})</p>
          </div>
          <button 
            onClick={() => {
              setIsRefreshing(true);
              refetch().finally(() => setIsRefreshing(false));
            }}
            disabled={isRefreshing}
            className="p-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-full disabled:opacity-50"
            title="Refresh link"
          >
            <Refresh style={{ fontSize: '20px' }} />
          </button>
        </div>

        {/* Instructions */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            <span className="text-xl">📸</span> How to Take Your Profile Picture:
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600 dark:text-blue-300">1.</span>
              <span><strong>Position yourself in the center:</strong> Align your face within the circular guide shown on the camera view</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600 dark:text-blue-300">2.</span>
              <span><strong>Look at the camera:</strong> Make sure your face is clearly visible and well-lit</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600 dark:text-blue-300">3.</span>
              <span><strong>Click Capture:</strong> The center portion will be automatically cropped for your profile picture</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600 dark:text-blue-300">4.</span>
              <span><strong>Review & Submit:</strong> Check the preview and retake if needed, then submit</span>
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video/Image Section */}
          <div className="lg:col-span-2 space-y-3">
            <div className="relative">
              {/* Center Guide Circle */}
              {!imageDataUrl && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                  <div className="w-64 h-64 sm:w-80 sm:h-80 border-4 border-dashed border-blue-400/60 dark:border-blue-500/60 rounded-full animate-pulse shadow-lg shadow-blue-500/30" />
                </div>
              )}

              {!imageDataUrl ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black aspect-video object-cover" />
              ) : (
                <img src={imageDataUrl} alt="preview" className="w-full rounded-lg bg-gray-100 dark:bg-slate-900" style={{ maxHeight: '400px', objectFit: 'contain' }} />
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-2">
              {!imageDataUrl ? (
                <button 
                  onClick={capture} 
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg"
                >
                  📸 Capture Photo
                </button>
              ) : (
                <>
                  <button 
                    onClick={handleRetake} 
                    className="flex-1 px-4 py-3 bg-gray-300 dark:bg-slate-600 dark:text-white text-gray-900 font-semibold rounded-lg hover:bg-gray-400 dark:hover:bg-slate-500 transition"
                  >
                    🔄 Retake
                  </button>
                  <button 
                    disabled={isSubmitting} 
                    onClick={submit} 
                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50 transition"
                  >
                    {isSubmitting ? '⏳ Submitting...' : '✅ Submit'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">👤 Employee Name</label>
              <input 
                value={overlayName} 
                onChange={(e) => setOverlayName(e.target.value)} 
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Will appear on image"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">📍 Location Name</label>
              <input 
                value={overrideLocationName} 
                onChange={(e) => setOverrideLocationName(e.target.value)} 
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g., Main Office, Conference Room"
              />
            </div>

            {coords && (
              <div className="p-3 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm space-y-1 text-gray-700 dark:text-gray-300">
                <div><strong>Latitude:</strong> {coords.lat?.toFixed(6)}</div>
                <div><strong>Longitude:</strong> {coords.lon?.toFixed(6)}</div>
                <div><strong>Accuracy:</strong> ±{Math.round(coords.accuracy || 0)}m</div>
              </div>
            )}

            {!coords && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                📍 Getting location...
              </div>
            )}

            {mapUrl && (
              <img src={mapUrl} alt="location map" className="w-full rounded-lg border border-gray-200 dark:border-slate-700" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
