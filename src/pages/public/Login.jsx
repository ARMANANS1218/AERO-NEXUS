// src/components/Login.jsx
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { motion as Motion } from "framer-motion";

import { useLoginUserMutation, useAcceptTermsMutation } from "../../features/auth/authApi";
import TermsContent from '../../components/TermsContent';
import { connectSocket } from "../../hooks/socket";
import ColorModeContext from '../../context/ColorModeContext';
import Loading from '../../components/common/Loading';
import { Button, Fab, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';

// Router-aware SignUp control placed inside the Login/Register pages
// function SignUpControl() {
//   const theme = useTheme();
//   const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
//   const location = useLocation();
//   const onSignupPage = location?.pathname === '/signup' || location?.pathname === '/register';
//   const label = onSignupPage ? 'SIGN' : 'SIGN UP';
//   const smallLabel = onSignupPage ? 'S' : 'U';

//   if (isSmall) {
//     return (
//       <Fab
//         color="primary"
//         size="small"
//         href="/signup"
//         aria-label={label}
//         sx={{ position: 'fixed', top: 12, right: 12, zIndex: 1400 }}
//       >
//         {smallLabel}
//       </Fab>
//     );
//   }

//   return (
//     <Button
//       variant="contained"
//       color="primary"
//       href="/signup"
//       aria-label={label}
//       sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1400 }}
//     >
//       {label}
//     </Button>
//   );
// }

export default function Login() {
  const navigate = useNavigate();
  const [loginUser, { isLoading }] = useLoginUserMutation();
  const [acceptTerms] = useAcceptTermsMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState("employee"); // 'employee' | 'customer'
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const colorMode = useContext(ColorModeContext);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)'); // match Tailwind lg breakpoint
    const onChange = (e) => setIsSmallScreen(e.matches);
    setIsSmallScreen(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  // ✅ Validation Schema
  const validationSchema = Yup.object().shape({
    employee_id: Yup.string().notRequired(),
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string().required("Password is required"),
  });

  // ✅ Formik Setup
  // Improved geolocation: try immediate reading, then briefly watch for a better (lower accuracy) fix
  const getBrowserLocation = () =>
    new Promise((resolve) => {
      try {
        if (!navigator?.geolocation) return resolve(null);

        let best = null;
        let watchId = null;
        let settled = false;

        const finish = () => {
          if (settled) return;
          settled = true;
          if (watchId != null) navigator.geolocation.clearWatch(watchId);
          resolve(best);
        };

        const onPos = (pos) => {
          const current = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyMeters: typeof pos.coords.accuracy === 'number' ? Math.round(pos.coords.accuracy) : undefined,
            timestamp: pos.timestamp || Date.now()
          };
          if (!best || (current.accuracyMeters || 99999) < (best.accuracyMeters || 99999)) {
            best = current;
          }
          // Early finish if we already have a very accurate fix
          if ((current.accuracyMeters || 99999) <= 30) finish();
        };

        const onErr = () => {
          // If we already have a reading, use it; otherwise return null
          finish();
        };

        // First shot: quick high-accuracy attempt
        navigator.geolocation.getCurrentPosition(onPos, onErr, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });

        // Then short watch to refine for a few seconds
        watchId = navigator.geolocation.watchPosition(onPos, onErr, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        });

        // Stop watching after 8 seconds if not already finished
        setTimeout(finish, 8000);
      } catch (e) {
        resolve(null);
      }
    });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: { employee_id: "", email: "", password: "" },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (mode === 'employee' && !termsChecked) {
          toast.warn('Please accept the Terms & Conditions to continue');
          return;
        }
        // Clean up the payload - remove empty employee_id
        const payload = mode === "employee"
          ? {
              ...(values.employee_id && values.employee_id.trim() ? { employee_id: values.employee_id.trim() } : {}),
              email: values.email,
              password: values.password
            }
          : { email: values.email, password: values.password };

        // Try to attach browser geolocation - show toast for employee mode since they may need location
        let locToastId;
        if (mode === 'employee') {
          try {
            locToastId = toast.loading('📍 Fetching your location...', { closeOnClick: false });
          } catch {}
        }
        
        const coords = await getBrowserLocation();
        
        if (coords) {
          payload.latitude = coords.latitude;
          payload.longitude = coords.longitude;
          if (coords.accuracyMeters != null) payload.accuracyMeters = coords.accuracyMeters;
          if (coords.timestamp) payload.locationTimestamp = coords.timestamp;
          
          // Show success for employee mode
          if (mode === 'employee' && locToastId) {
            try { 
              toast.update(locToastId, {
                render: '✓ Location fetched',
                type: 'success',
                isLoading: false,
                autoClose: 1500
              });
            } catch {}
          }
        } else {
          // Location failed - dismiss toast for employee mode
          if (mode === 'employee' && locToastId) {
            try { 
              toast.dismiss(locToastId);
            } catch {}
          }
        }

        // Fetch actual public IP address and show toast (for employee mode)
        let ipToastId;
        try {
          if (mode === 'employee') {
            ipToastId = toast.loading('🔒 Checking your IP access...', { closeOnClick: false });
          }
          
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipResponse.json();
          if (ipData?.ip) {
            payload.clientPublicIp = ipData.ip;
            
            // Show IP verified toast (for employee mode)
            if (mode === 'employee' && ipToastId) {
              try {
                toast.update(ipToastId, {
                  render: `✓ IP verified: ${ipData.ip}`,
                  type: 'success',
                  isLoading: false,
                  autoClose: 1500
                });
              } catch {}
            }
          }
        } catch (ipErr) {
          console.warn('Failed to fetch public IP:', ipErr);
          if (mode === 'employee' && ipToastId) {
            try {
              toast.update(ipToastId, {
                render: '⚠️ IP check failed',
                type: 'warning',
                isLoading: false,
                autoClose: 1500
              });
            } catch {}
          }
          // Continue with login even if IP fetch fails
        }

        console.log('Login payload:', { ...payload, password: '***' });
        console.log('Login mode:', mode);
        const res = await loginUser(payload).unwrap();
        const userId = res.data?._id || res?.data?.id;
        const token = res.token;

        localStorage.setItem("token", token);
        connectSocket({ token, id: userId });

        const roleRoutes = {
          Admin: "/admin",
          Agent: "/agent",
          QA: "/qa",
          TL: "/tl",
          Customer: "/customer",
        };

        const employeeRoles = ["Admin", "Agent", "QA", "TL"];
        const role = res?.data?.role;
        if (employeeRoles.includes(role) && !res?.data?.acceptedTerms) {
          try {
            await acceptTerms().unwrap();
          } catch (e) {
            console.warn('Failed to persist terms acceptance immediately:', e);
          }
        }

        const redirectPath = roleRoutes[role];
        if (redirectPath) {
          toast.success(`${role} login successful!`);
          navigate(redirectPath);
        } else {
          toast.error("Access denied: Unauthorized role");
        }
      } catch (error) {
        console.error("Login error:", error);
        // Ensure we dismiss any pending location toast in case of errors
        try { toast.dismiss(); } catch {}
        
        // Better error handling for CORS/Network issues
        if (error?.status === 'FETCH_ERROR' || error?.error?.includes('Failed to fetch')) {
          toast.error(
            'Backend is waking up... Please wait 30 seconds and try again.',
            { autoClose: 8000 }
          );
        } else if (error?.status === 403 && error?.data?.blocked) {
          // Account blocked
          toast.error(error?.data?.message || 'Account blocked. Please contact Administrator.', {
            autoClose: 8000
          });
        } else if (error?.status === 403 && error?.data?.details?.yourIp) {
          // IP address not authorized
          const yourIp = error?.data?.details?.yourIp;
          const allowedIps = error?.data?.details?.allowedIps || [];
          toast.error(
            `🚫 Access Denied: Your IP (${yourIp}) is not authorized. Please contact your administrator.`,
            { autoClose: 8000 }
          );
        } else if (error?.status === 401 && error?.data?.attemptsLeft !== undefined) {
          // Wrong password with attempts remaining
          toast.warning(error?.data?.message || 'Wrong password', {
            autoClose: 5000
          });
        } else if (error?.status === 400 && (error?.data?.message?.toLowerCase?.().includes('location required') || error?.data?.message?.toLowerCase?.().includes('latitude') || error?.data?.message?.toLowerCase?.().includes('location access'))) {
          // Location is required - show helpful message
          toast.error(
            <div>
              <div className="font-semibold">📍 Location Access Required</div>
              <div className="text-sm mt-1">Your organization requires location verification for login. Please allow location access in your browser and try again.</div>
            </div>,
            { autoClose: 6000 }
          );
        } else if (error?.status === 403 && error?.data?.message?.toLowerCase?.().includes('not allowed from your current location')) {
          toast.error('🚫 Login blocked: You are outside approved office location.');
        } else if (error?.status === 403 && error?.data?.message?.toLowerCase?.().includes('location')) {
          // Generic location-related 403 error
          toast.error(
            <div>
              <div className="font-semibold">🚫 Location Verification Failed</div>
              <div className="text-sm mt-1">{error?.data?.message}</div>
            </div>,
            { autoClose: 6000 }
          );
        } else {
          toast.error(error?.data?.message || "Login failed");
        }
      }
    },
  });

  /* ----------------- swap animation (applies to the left & right panels) ----------------- */

  // Smooth transition with proper easing
  const transition = { 
    duration: 0.7, 
    ease: [0.43, 0.13, 0.23, 0.96] // Custom cubic-bezier for smooth motion
  };

  // Desktop: horizontal swap animation
  // Mobile: No animation on container, just keep visible
  const leftPanelVariants = isSmallScreen
    ? {
        employee: { opacity: 1, transition },
        customer: { opacity: 1, transition },
      }
    : {
        employee: { x: "0%", transition },
        customer: { x: "100%", transition },
      };

  const rightPanelVariants = isSmallScreen
    ? {
        employee: { opacity: 1, transition },
        customer: { opacity: 1, transition },
      }
    : {
        employee: { x: "0%", transition },
        customer: { x: "-100%", transition },
      };

  // If small screen, render a stacked layout with smooth content transitions
  if (isSmallScreen) {
    return (
      <>
        <div className="min-h-screen w-full flex flex-col bg-[#05050a]">
          {/* TOP — Violet info panel */}
          <div className="w-full flex flex-col justify-center items-start p-6 text-white bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-500">
            <div className="max-w-md w-full">
              <Motion.h1 
                key={`title-${mode}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-3xl font-extrabold mb-3 text-white"
              >
                {/* Customer login removed */}
                {"WELCOME BACK!"}
              </Motion.h1>
              <Motion.p 
                key={`desc-${mode}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="text-sm text-white mb-6"
              >
                {"Sign in to access your internal tools, dashboards, and team resources."}
              </Motion.p>
              <div className="flex gap-3">
                <button
                  className="px-4 py-2 rounded-md text-sm font-medium bg-white text-violet-700 shadow-lg"
                  disabled
                >
                  Agent
                </button>
                {/* Customer toggle removed */}
              </div>
            </div>
          </div>

          {/* BOTTOM — Login form */}
          <div className="w-full flex-1 flex items-center justify-center p-6 bg-[#05050a]">
            <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
              <Motion.h2 
                key={`form-title-${mode}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-lg font-semibold text-center mb-4 text-white"
              >
                {"Agent Login"}
              </Motion.h2>

              <form onSubmit={formik.handleSubmit} className="space-y-4">
                {mode === "employee" && (
                  <Motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="text-xs text-white/90 block mb-2">Agent ID</label>
                    <input
                      name="employee_id"
                      placeholder="Agent ID"
                      value={formik.values.employee_id}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${
                        formik.touched.employee_id && formik.errors.employee_id
                          ? "border-red-500"
                          : ""
                      }`}
                    />
                    {formik.touched.employee_id && formik.errors.employee_id && (
                      <p className="text-xs text-red-400 mt-1">{formik.errors.employee_id}</p>
                    )}
                  </Motion.div>
                )}

                <div>
                  <label className="text-xs text-white/90 block mb-2">Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="Email address"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${
                      formik.touched.email && formik.errors.email ? "border-red-500" : ""
                    }`}
                  />
                  {formik.touched.email && formik.errors.email && (
                    <p className="text-xs text-red-400 mt-1">{formik.errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-white/90 block mb-2">Password</label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${
                        formik.touched.password && formik.errors.password ? "border-red-500" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/90 hover:text-white transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <AiOutlineEye className="h-5 w-5" /> : <AiOutlineEyeInvisible className="h-5 w-5" />}
                    </button>
                  </div>
                  {formik.touched.password && formik.errors.password && (
                    <p className="text-xs text-red-400 mt-1">{formik.errors.password}</p>
                  )}
                </div>

                {mode === 'employee' && (
                  <div className="mt-2 text-xs text-white/80 flex items-start gap-2">
                    <input
                      id="termsCheck-sm"
                      type="checkbox"
                      checked={termsChecked}
                      onChange={(e) => setTermsChecked(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-violet-500"
                    />
                    <label htmlFor="termsCheck-sm">
                      I have read and agree to the{' '}
                      <button type="button" onClick={() => setShowTermsModal(true)} className="underline text-violet-300 hover:text-violet-200">Terms & Conditions</button>
                    </label>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || (mode === 'employee' && !termsChecked)}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold hover:from-violet-600 hover:to-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#05050a] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/30"
                  >
                    {isLoading ? "Logging in..." : "Login"}
                  </button>
                </div>

                <p className="mt-3 text-xs text-white/70 text-center">
                  Employee access only. Contact admin for help.
                </p>
              </form>
            </div>
          </div>

          {/* Loading spinner overlay */}
          {isLoading && <Loading fullScreen={true} size="lg" />}
        </div>

        {/* Terms Modal (small screen) */}
        {showTermsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-950 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Terms & Conditions</h3>
                <button onClick={() => setShowTermsModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <TermsContent />
              </div>
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                <button onClick={() => setShowTermsModal(false)} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-200">Close</button>
                <button onClick={() => { setTermsChecked(true); setShowTermsModal(false); }} className="px-4 py-2 rounded-lg bg-violet-600 text-white">I Agree</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop / larger screens: keep animated two-column layout
  return (
    <>
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#05050a]">
      {/* SignUpControl (router-aware, placed inside Router) */}
      {/* <SignUpControl /> */}
      {/* Theme toggle (desktop layout) - positioned left of SignUp */}
      {/* <button
        onClick={() => colorMode?.toggleColorMode?.()}
        aria-label="Toggle theme"
        className="theme-toggle-btn"
        // positioned left of the SignUp button (SignUp large: right:16)
        style={{ position: 'fixed', top: 16, right: 120, zIndex: 1500 }}
      >
        {colorMode?.mode === 'light' ? '🌙' : '☀️'}
      </button> */}
      {/* LEFT SIDE — Solid Violet (animated) */}
      <Motion.div
        className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-500 text-white p-6 md:p-10 overflow-hidden"
        initial={false}
        animate={mode}
        variants={leftPanelVariants}
        style={{ willChange: "transform" }}
      >
        <div className="max-w-md">
          <Motion.h1 
            key={`desktop-title-${mode}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-extrabold mb-4"
          >
            {/* Customer variant removed */}
            {"WELCOME BACK!"}
          </Motion.h1>
          <Motion.p 
            key={`desktop-desc-${mode}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base md:text-lg text-white/90 mb-8"
          >
            {"Sign in to access your internal tools, dashboards, and team resources."}
          </Motion.p>

          {/* Mode Switch Buttons (Customer removed) */}
          <div className="flex gap-3">
            <button
              className="px-4 py-2 rounded-md text-sm font-medium bg-white text-violet-700 shadow-lg"
              disabled
            >
              Agent
            </button>
          </div>
        </div>
      </Motion.div>

      {/* RIGHT SIDE — Login Form (animated) */}
      <Motion.div
        className="w-full lg:w-1/2 flex items-center justify-center bg-[#0b0b0f] text-white p-6 md:p-8 relative overflow-hidden"
        initial={false}
        animate={mode}
        variants={rightPanelVariants}
        style={{ willChange: "transform" }}
      >
        <div className="w-full max-w-md bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
          <Motion.h2 
            key={`desktop-form-title-${mode}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-xl md:text-2xl font-semibold text-center mb-6"
          >
            {"Agent Login"}
          </Motion.h2>

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            {mode === "employee" && (
              <Motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="text-xs text-white/70 block mb-2">Agent ID</label>
                <input
                  name="employee_id"
                  placeholder="Agent ID"
                  value={formik.values.employee_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-3 py-2 rounded-md bg-white/10 border border-white/10 placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${
                    formik.touched.employee_id && formik.errors.employee_id ? "border-red-500" : ""
                  }`}
                />
                {formik.touched.employee_id && formik.errors.employee_id && (
                  <p className="text-xs text-red-400 mt-1">{formik.errors.employee_id}</p>
                )}
              </Motion.div>
            )}

            <div>
              <label className="text-xs text-white/70 block mb-2">Email</label>
              <input
                name="email"
                type="email"
                placeholder="Email address"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-3 py-2 rounded-md bg-white/10 border border-white/10 placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  formik.touched.email && formik.errors.email ? "border-red-500" : ""
                }`}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-xs text-red-400 mt-1">{formik.errors.email}</p>
              )}
            </div>

            <div>
              <label className="text-xs text-white/70 block mb-2">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-3 py-2 rounded-md bg-white/10 border border-white/10 placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${
                    formik.touched.password && formik.errors.password ? "border-red-500" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/70 hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <AiOutlineEye className="h-5 w-5" /> : <AiOutlineEyeInvisible className="h-5 w-5" />}
                </button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="text-xs text-red-400 mt-1">{formik.errors.password}</p>
              )}
            </div>

            {mode === 'employee' && (
              <div className="text-xs text-white/80 flex items-start gap-2">
                <input
                  id="termsCheck-lg"
                  type="checkbox"
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-violet-500"
                />
                <label htmlFor="termsCheck-lg">
                  I have read and agree to the{' '}
                  <button type="button" onClick={() => setShowTermsModal(true)} className="underline text-violet-300 hover:text-violet-200">Terms & Conditions</button>
                </label>
              </div>
            )}

            <Motion.button
              type="submit"
              disabled={isLoading || (mode === 'employee' && !termsChecked)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2 px-4 rounded-md bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-semibold hover:from-violet-700 hover:to-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? "Logging in..." : "Login"}
            </Motion.button>
          </form>
        </div>
      </Motion.div>

      {/* Loading spinner overlay */}
      {isLoading && <Loading fullScreen={true} size="lg" />}
    </div>

    {/* Terms Modal (desktop) */}
    {showTermsModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-950 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Terms & Conditions</h3>
            <button onClick={() => setShowTermsModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
          </div>
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <TermsContent />
          </div>
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
            <button onClick={() => setShowTermsModal(false)} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-200">Close</button>
            <button onClick={() => { setTermsChecked(true); setShowTermsModal(false); }} className="px-4 py-2 rounded-lg bg-violet-600 text-white">I Agree</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

