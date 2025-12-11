import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

import { useRegisterUserMutation } from "../../features/auth/authApi";
import ColorModeContext from '../../context/ColorModeContext';
import Loading from '../../components/common/Loading';
import { Button, Fab, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';

// Router-aware SignUp control placed inside the Login/Register pages
function SignUpControl() {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const onSignupPage = location?.pathname === '/signup' || location?.pathname === '/register';
  const label = onSignupPage ? 'LOGIN' : 'SIGN UP';
  const smallLabel = onSignupPage ? 'L' : 'U';

  if (isSmall) {
    return (
      <Fab
        color="primary"
        size="small"
        href={onSignupPage ? '/login' : '/signup'}
        aria-label={label}
        sx={{ 
          position: 'fixed', 
          top: 12, 
          right: 12, 
          zIndex: 1400,
          '&:hover': {
            backgroundColor: 'rgba(156, 163, 175, 0.9)', // gray-400 with opacity
          }
        }}
      >
        {smallLabel}
      </Fab>
    );
  }

  return (
    <Button
      variant="contained"
      color="primary"
      href={onSignupPage ? '/login' : '/signup'}
      aria-label={label}
      sx={{ 
        position: 'fixed', 
        top: 16, 
        right: 16, 
        zIndex: 1400,
        '&:hover': {
          backgroundColor: 'rgba(156, 163, 175, 0.9)', // gray-400 with opacity
        }
      }}
    >
      {label}
    </Button>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [registerUser, { isLoading }] = useRegisterUserMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState("Customer"); // 'Agent' | 'Admin' | 'QA' | 'Customer'
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const colorMode = useContext(ColorModeContext);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const onChange = (e) => setIsSmallScreen(e.matches);
    setIsSmallScreen(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  // Simpler conditional schema (avoid complex `when` which can cause runtime issues with some Yup versions)
  const validationSchema = Yup.object().shape({
    employee_id: mode !== "Customer" ? Yup.string().required("Employee ID is required") : Yup.string().notRequired(),
    user_name: Yup.string().required('Username is required'),
    name: Yup.string().required('Name is required'),
    mobile: Yup.string().required('Mobile number is required'),
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string().required("Password is required"),
  });

  const formik = useFormik({
    enableReinitialize: true,
  initialValues: { employee_id: "", user_name: "", name: "", mobile: "", email: "", password: "" },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const payload = {
          user_name: values.user_name || values.email.split('@')[0],
          name: values.name,
          mobile: values.mobile,
          email: values.email,
          password: values.password,
          role: mode, // 'Agent', 'Admin', 'QA', or 'Customer'
          employee_id: mode !== 'Customer' ? values.employee_id : undefined,
        };

        console.log('Register payload:', payload);
        const res = await registerUser(payload).unwrap();
        console.log('Register response:', res);
        toast.success('Registration successful — please login');
        navigate('/login');
      } catch (error) {
        console.error('Register error:', error);
        const message = error?.data?.message || error?.error || 'Registration failed';
        toast.error(message);
      }
    },
  });

  // Theme toggle component
  // const ThemeToggle = () => (
  //   <button
  //     onClick={() => colorMode?.toggleColorMode?.()}
  //     aria-label="Toggle theme"
  //     className="fixed top-3 right-16 z-[1500] p-2 rounded-md transition-colors bg-white/8 text-white hover:bg-white/12 dark:bg-black/8 dark:text-white"
  //     style={{ backdropFilter: 'blur(6px)' }}
  //   >
  //     {colorMode?.mode === 'light' ? '🌙' : '☀️'}
  //   </button>
  // );

  if (isSmallScreen) {
    return (
      <>
        {/* <ThemeToggle /> */}
        <SignUpControl />
        <div className="min-h-screen w-full flex flex-col bg-[#05050a]">
          <div className="w-full flex flex-col justify-center items-start p-6 text-white bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-500 dark:from-violet-600 dark:via-violet-500 dark:to-fuchsia-400">
            <div className="max-w-md w-full">
              <h1 className="text-3xl font-extrabold mb-3">CREATE ACCOUNT</h1>
              <p className="text-sm text-white/90 mb-6">Select your role to register.</p>
              <div className="grid grid-cols-2 gap-3">
                {/* <button
                  onClick={() => setMode("Agent")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    mode === "Agent"
                      ? "bg-white text-violet-700"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  Agent
                </button>
                <button
                  onClick={() => setMode("Admin")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    mode === "Admin"
                      ? "bg-white text-violet-700"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => setMode("QA")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    mode === "QA"
                      ? "bg-white text-violet-700"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  QA
                </button> */}
                <button
                  onClick={() => setMode("Customer")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    mode === "Customer"
                      ? "bg-white text-violet-700"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  Customer
                </button>
              </div>
            </div>
          </div>

          <div className="w-full flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white/6 dark:bg-gray-950/75 backdrop-blur-md border border-white/8 dark:border-gray-800 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-center mb-4">{mode} Sign Up</h2>
              <form onSubmit={formik.handleSubmit} className="space-y-4">
                {mode !== 'Customer' && (
                  <div>
                    <label className="text-xs text-white/70 block mb-2">Employee ID</label>
                    <input
                      name="employee_id"
                      placeholder="Employee ID"
                      value={formik.values.employee_id}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-3 py-2 rounded-md bg-white/90 dark:bg-gray-950/60 border border-white/20 dark:border-gray-700 placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                        formik.touched.employee_id && formik.errors.employee_id ? 'border-red-500' : ''
                      }`}
                    />
                    {formik.touched.employee_id && formik.errors.employee_id && (
                      <p className="text-xs text-red-400 mt-1">{formik.errors.employee_id}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-xs text-white/70 block mb-2">Username</label>
                  <input
                    name="user_name"
                    placeholder="Username"
                    value={formik.values.user_name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-3 py-2 rounded-md bg-white/90 dark:bg-gray-950/60 border border-white/20 dark:border-gray-700 placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                      formik.touched.user_name && formik.errors.user_name ? 'border-red-500' : ''
                    }`}
                  />
                  {formik.touched.user_name && formik.errors.user_name && (
                    <p className="text-xs text-red-400 mt-1">{formik.errors.user_name}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-white/70 block mb-2">Mobile</label>
                  <input
                    name="mobile"
                    placeholder="Mobile number"
                    value={formik.values.mobile}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-3 py-2 rounded-md bg-white/90 dark:bg-gray-950/60 border border-white/20 dark:border-gray-700 placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                      formik.touched.mobile && formik.errors.mobile ? 'border-red-500' : ''
                    }`}
                  />
                  {formik.touched.mobile && formik.errors.mobile && (
                    <p className="text-xs text-red-400 mt-1">{formik.touched.mobile}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-white/70 block mb-2">Name</label>
                  <input
                    name="name"
                    placeholder="Full name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-3 py-2 rounded-md bg-white/90 dark:bg-gray-950/60 border border-white/20 dark:border-gray-700 placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                      formik.touched.name && formik.errors.name ? 'border-red-500' : ''
                    }`}
                  />
                  {formik.touched.name && formik.errors.name && (
                    <p className="text-xs text-red-400 mt-1">{formik.errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-white/70 block mb-2">Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="Email address"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-3 py-2 rounded-md bg-white/90 dark:bg-gray-950/60 border border-white/20 dark:border-gray-700 placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                      formik.touched.email && formik.errors.email ? 'border-red-500' : ''
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
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-3 py-2 rounded-md bg-white/90 dark:bg-gray-950/60 border border-white/20 dark:border-gray-700 placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                        formik.touched.password && formik.errors.password ? 'border-red-500' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/70"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <AiOutlineEye className="h-5 w-5" /> : <AiOutlineEyeInvisible className="h-5 w-5" />}
                    </button>
                  </div>
                  {formik.touched.password && formik.errors.password && (
                    <p className="text-xs text-red-400 mt-1">{formik.errors.password}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold hover:scale-[1.01] transition"
                  >
                    {isLoading ? 'Signing...' : `Sign up as ${mode}`}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {isLoading && <Loading fullScreen={true} size="lg" />}
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#05050a]">
      {/* <ThemeToggle /> */}
      <SignUpControl />
      <div
        className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-500 text-white p-6 md:p-10"
      >
        <div className="max-w-md">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">CREATE ACCOUNT</h1>
          <p className="text-base md:text-lg text-white/90 mb-8">Select your role to register.</p>

          <div className="grid grid-cols-2 gap-3">
            {/* <button
              onClick={() => setMode('Agent')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                mode === 'Agent' ? 'bg-white text-violet-700' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Agent
            </button>
            <button
              onClick={() => setMode('Admin')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                mode === 'Admin' ? 'bg-white text-violet-700' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => setMode('QA')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                mode === 'QA' ? 'bg-white text-violet-700' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              QA
            </button> */}
            <button
              onClick={() => setMode('Customer')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                mode === 'Customer' ? 'bg-white text-violet-700' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Customer
            </button>
          </div>
        </div>
      </div>

      <div
        className="w-full lg:w-1/2 flex items-center justify-center bg-[#0b0b0f] text-white p-6 md:p-8 relative"
      >
        <div className="w-full max-w-md bg-white/6 dark:bg-gray-950/75 backdrop-blur-md border border-white/8 dark:border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl">
          <h2 className="text-xl md:text-2xl font-semibold text-center mb-6">{mode} Sign Up</h2>

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            {mode !== 'Customer' && (
              <div>
                <label className="text-xs text-white/70 block mb-2">Employee ID</label>
                <input
                  name="employee_id"
                  placeholder="Employee ID"
                  value={formik.values.employee_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-3 py-2 rounded-md bg-white/90 dark:bg-gray-950/60 border border-white/20 dark:border-gray-700 placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                    formik.touched.employee_id && formik.errors.employee_id ? 'border-red-500' : ''
                  }`}
                />
                {formik.touched.employee_id && formik.errors.employee_id && (
                  <p className="text-xs text-red-400 mt-1">{formik.errors.employee_id}</p>
                )}
              </div>
            )}

            <div>
              <label className="text-xs text-white/70 block mb-2">Name</label>
              <input
                name="name"
                placeholder="Full name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-3 py-2 rounded-md bg-white/90 dark:bg-gray-950/60 border border-white/20 dark:border-gray-700 placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  formik.touched.name && formik.errors.name ? 'border-red-500' : ''
                }`}
              />
              {formik.touched.name && formik.errors.name && (
                <p className="text-xs text-red-400 mt-1">{formik.errors.name}</p>
              )}
            </div>

            <div>
              <label className="text-xs text-white/70 block mb-2">Username</label>
              <input
                name="user_name"
                placeholder="Username"
                value={formik.values.user_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-3 py-2 rounded-md bg-white/90 dark:bg-gray-950/60 border border-white/20 dark:border-gray-700 placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  formik.touched.user_name && formik.errors.user_name ? 'border-red-500' : ''
                }`}
              />
              {formik.touched.user_name && formik.errors.user_name && (
                <p className="text-xs text-red-400 mt-1">{formik.errors.user_name}</p>
              )}
            </div>

            <div>
              <label className="text-xs text-white/70 block mb-2">Mobile</label>
              <input
                name="mobile"
                placeholder="Mobile number"
                value={formik.values.mobile}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-3 py-2 rounded-md bg-white/90 dark:bg-gray-950/60 border border-white/20 dark:border-gray-700 placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  formik.touched.mobile && formik.errors.mobile ? 'border-red-500' : ''
                }`}
              />
              {formik.touched.mobile && formik.errors.mobile && (
                <p className="text-xs text-red-400 mt-1">{formik.errors.mobile}</p>
              )}
            </div>

            <div>
              <label className="text-xs text-white/70 block mb-2">Email</label>
              <input
                name="email"
                type="email"
                placeholder="Email address"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-3 py-2 rounded-md bg-white/90 dark:bg-gray-950/60 border border-white/20 dark:border-gray-700 placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  formik.touched.email && formik.errors.email ? 'border-red-500' : ''
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
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-3 py-2 rounded-md bg-white/90 dark:bg-gray-950/60 border border-white/20 dark:border-gray-700 placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                    formik.touched.password && formik.errors.password ? 'border-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/70"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <AiOutlineEye className="h-5 w-5" /> : <AiOutlineEyeInvisible className="h-5 w-5" />}
                </button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="text-xs text-red-400 mt-1">{formik.errors.password}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 mt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:flex-1 py-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold hover:scale-[1.01] transition"
                onClick={(e) => {
                  // Defensive: ensure Formik submit is invoked even if the native submit is prevented
                  console.log('Submit button clicked');
                  if (e && e.preventDefault) {
                    // allow normal submit flow, but also call submitForm as fallback
                    formik.submitForm();
                  }
                }}
              >
                {isLoading ? 'Signing...' : `Sign up as ${mode}`}
              </button>
            </div>
          </form>
        </div>
      </div>

      {isLoading && <Loading fullScreen={true} size="lg" />}
    </div>
  );
}

