import React, { useMemo, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { Visibility, VisibilityOff, CheckCircle, DeleteOutline } from '@mui/icons-material';
import { useRegisterUserMutation } from '../../../features/auth/authApi';
import { useCreateLinkMutation, useListCapturesQuery, useUpdateCaptureMetaMutation, useDeleteCaptureMutation } from '../../../features/geocam/geocamApi';

const CreateEmployee = () => {
  const [registerUser, { isLoading }] = useRegisterUserMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCapture, setSelectedCapture] = useState(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isGenOpen, setIsGenOpen] = useState(false);
  const [genName, setGenName] = useState('');
  const [genRole, setGenRole] = useState('Agent');
  const [genExpires, setGenExpires] = useState(30);
  const [createLink, { data: genData, isLoading: genLoading }] = useCreateLinkMutation();
  
  // Filter and pagination states
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Query with filters and pagination
  const { data: capturesData, refetch: refetchCaptures } = useListCapturesQuery({ 
    status: filterStatus, 
    search: searchQuery, 
    page: currentPage, 
    limit: pageSize 
  });
  
  const [updateCaptureMeta] = useUpdateCaptureMetaMutation();
  const [deleteCapture] = useDeleteCaptureMutation();
  const [passwordMode, setPasswordMode] = useState('auto'); // 'auto' or 'manual'

  // Generate strong random password
  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    // Ensure at least one of each type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)];
    
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const validationSchema = Yup.object({
    employee_id: Yup.string().required('Employee ID is required'),
    user_name: Yup.string().required('Username is required'),
    name: Yup.string().required('Name is required'),
    mobile: Yup.string().required('Mobile number is required').matches(/^[0-9]{10}$/, 'Must be 10 digits'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
    role: Yup.string().required('Role is required'),
    department: Yup.string().when('role', {
      is: (role) => ['Agent','QA','TL'].includes(role),
      then: (schema) => schema.required('Department is required'),
      otherwise: (schema) => schema.notRequired()
    }),
    tier: Yup.string().when('role', {
      is: (role) => ['Agent','QA','TL'].includes(role),
      then: (schema) => schema.required('Tier is required'),
      otherwise: (schema) => schema.notRequired()
    }),
    alias: Yup.string().when('role', {
      is: (role) => ['Agent','QA','TL'].includes(role),
      then: (schema) => schema.required('Alias is required for Agent, QA, and TL roles'),
      otherwise: (schema) => schema.notRequired()
    }),
    location: Yup.string(),
  });

  const formik = useFormik({
    initialValues: {
      employee_id: '',
      user_name: '',
      name: '',
      mobile: '',
      email: '',
      password: '',
      role: '',
      department: '',
      tier: '',
      alias: '',
      location: '',
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const payload = { ...values };
        if (selectedCapture) {
          payload.profileImageUrl = selectedCapture.capture?.imageUrl;
          payload.profileImagePublicId = selectedCapture.capture?.imagePublicId;
        }
        const res = await registerUser(payload).unwrap();
        toast.success('Employee created successfully!');
        resetForm();
        setSelectedCapture(null);
        setProfilePreview('');
      } catch (error) {
        console.error('Create employee error:', error);
        toast.error(error?.data?.message || 'Failed to create employee');
      }
    },
  });

  const captures = useMemo(() => capturesData?.data || [], [capturesData]);
  const pagination = useMemo(() => capturesData?.pagination || { total: 0, pages: 1, page: 1, limit: pageSize }, [capturesData]);

  const mapUrl = (lat, lon) => {
    const key = import.meta.env.VITE_GEOAPIFY_KEY;
    if (!lat || !lon || !key) return null;
    return `https://maps.geoapify.com/v1/staticmap?style=osm-carto&center=lonlat:${lon},${lat}&zoom=15&marker=lonlat:${lon},${lat};type:material;color:%23ff0000;size:small&width=400&height=200&apiKey=${key}`;
  };

  const handleGenerate = async (e) => {
    e?.preventDefault?.();
    try {
      if (!genName) return toast.error('Enter employee name');
      const { data } = await createLink({ employeeName: genName, role: genRole, expiresInMinutes: Number(genExpires) }).unwrap();
      toast.success('Link generated');
    } catch (e) {
      toast.error(e?.data?.message || 'Failed to generate');
    }
  };

  const saveMeta = async (cap) => {
    try {
      await updateCaptureMeta({ id: cap._id, employeeName: cap.employeeName, addressFormatted: cap.capture?.address?.formatted, lat: cap.capture?.lat, lon: cap.capture?.lon }).unwrap();
      toast.success('Updated');
      refetchCaptures();
    } catch (e) {
      toast.error('Update failed');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const captureId = e.dataTransfer.getData('captureId');
    if (captureId) {
      const cap = captures.find(c => c._id === captureId);
      if (cap) {
        setSelectedCapture(cap);
        setProfilePreview(cap.capture?.imageUrl || '');
        if (cap.capture?.address?.formatted) {
          formik.setFieldValue('location', cap.capture.address.formatted);
        }
        toast.success('Profile image and location set from Geocam');
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDeleteCapture = async (capId) => {
    if (!window.confirm('Are you sure you want to delete this capture?')) return;
    try {
      await deleteCapture(capId).unwrap();
      toast.success('Capture deleted successfully');
      refetchCaptures();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete capture');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-6">
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Employee</h1>
          <button onClick={() => setIsGenOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded">Generate Geocam Link</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
          <form onSubmit={formik.handleSubmit}>
            {/* Profile Picture Drag & Drop */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Profile Picture
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition ${
                  isDraggingOver
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50'
                }`}
              >
                {profilePreview ? (
                  <div className="relative w-full h-full p-2">
                    <img src={profilePreview} alt="preview" className="w-full h-full object-contain rounded" />
                    <button
                      type="button"
                      onClick={() => { setProfilePreview(''); setSelectedCapture(null); }}
                      className="absolute top-3 right-3 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center px-4">
                      Click "Use For This Employee" from right panel

                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee ID */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Employee ID
              </label>
              <input
                type="text"
                name="employee_id"
                value={formik.values.employee_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
                  bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent
                  placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Enter employee ID"
              />
              {formik.touched.employee_id && formik.errors.employee_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.employee_id}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Username
              </label>
              <input
                type="text"
                name="user_name"
                value={formik.values.user_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
                  bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent
                  placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Enter username"
              />
              {formik.touched.user_name && formik.errors.user_name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.user_name}</p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
                  bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent
                  placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Enter full name"
              />
              {formik.touched.name && formik.errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.name}</p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Mobile
              </label>
              <input
                type="text"
                name="mobile"
                value={formik.values.mobile}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
                  bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent
                  placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Enter 10-digit mobile number"
              />
              {formik.touched.mobile && formik.errors.mobile && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.mobile}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
                  bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent
                  placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Enter email address"
              />
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Password
              </label>
              
              {/* Password Mode Toggle */}
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordMode('auto');
                    const newPass = generatePassword();
                    formik.setFieldValue('password', newPass);
                    toast.success('Strong password generated!');
                  }}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    passwordMode === 'auto'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                  }`}
                >
                  🔐 Auto Generate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPasswordMode('manual');
                    formik.setFieldValue('password', '');
                  }}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    passwordMode === 'manual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                  }`}
                >
                  ✍️ Manual Entry
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={passwordMode === 'auto' && formik.values.password}
                  className="w-full px-4 py-2 pr-20 rounded-lg border border-gray-300 dark:border-slate-600 
                    bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent
                    placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-60"
                  placeholder={passwordMode === 'auto' ? 'Auto-generated password' : 'Enter password (min 6 characters)'}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                  {passwordMode === 'auto' && formik.values.password && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(formik.values.password);
                        toast.success('Password copied to clipboard!');
                      }}
                      className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 p-1"
                      title="Copy password"
                    >
                      📋
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </button>
                </div>
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.password}</p>
              )}
              {passwordMode === 'auto' && formik.values.password && (
                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                  ✓ Strong password generated (copy before submitting)
                </p>
              )}
            </div>

            {/* Role (includes TL) */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Role
              </label>
              <select
                name="role"
                value={formik.values.role}
                onChange={(e) => {
                  formik.handleChange(e);
                  const value = e.target.value;
                  // Clear tier/department/alias if role does not require them
                  if (!['Agent','QA','TL'].includes(value)) {
                    formik.setFieldValue('tier', '');
                    formik.setFieldValue('alias', '');
                    // Department optional for non-employee roles
                    // Keep department if UI still shows it, else clear
                  }
                }}
                onBlur={formik.handleBlur}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
                  bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              >
                <option value="">Select role</option>
                <option value="Admin">Admin</option>
                <option value="Agent">Agent</option>
                <option value="QA">QA</option>
                <option value="TL">TL</option>
              </select>
              {formik.touched.role && formik.errors.role && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.role}</p>
              )}
            </div>

            {/* Department (only required for Agent/QA/TL) */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Department
              </label>
              <select
                name="department"
                value={formik.values.department}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
                  bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              >
                <option value="">Select department</option>
                <option value="Accounts">Accounts</option>
                <option value="Technicals">Technicals</option>
                <option value="Billings">Billings</option>
                <option value="Supports">Supports</option>
              </select>
              {formik.touched.department && formik.errors.department && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.department}</p>
              )}
            </div>

            {/* Tier (only for Agent/QA/TL) */}
            {['Agent','QA','TL'].includes(formik.values.role) && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Tier <span className="text-red-500">*</span>
                </label>
                <select
                  name="tier"
                  value={formik.values.tier}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
                    bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="">Select tier</option>
                  <option value="Tier-1">Tier-1</option>
                  <option value="Tier-2">Tier-2</option>
                  <option value="Tier-3">Tier-3</option>
                </select>
                {formik.touched.tier && formik.errors.tier && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.tier}</p>
                )}
              </div>
            )}

            {/* Alias (only for Agent/QA/TL) */}
            {['Agent','QA','TL'].includes(formik.values.role) && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Alias Name <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block font-normal">
                    This name will be shown in chat conversations and tickets
                  </span>
                </label>
                <input
                  type="text"
                  name="alias"
                  value={formik.values.alias}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder={`e.g., Agent ${formik.values.name.split(' ')[0] || 'John'}`}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
                    bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                />
                {formik.touched.alias && formik.errors.alias && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.alias}</p>
                )}
              </div>
            )}

            {/* Location (editable, auto-populated from Geocam) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Location <span className="text-xs text-gray-500 dark:text-gray-400">(auto-filled from Geocam or manual entry)</span>
              </label>
              <input
                type="text"
                name="location"
                value={formik.values.location}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
                  bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent
                  placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Location will auto-fill from Geocam or enter manually"
              />
            </div>
          </div>

            {/* Submit Button */}
            <div className="mt-8">
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 
                  text-white font-semibold rounded-lg shadow-md 
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-200"
              >
                {isLoading ? 'Creating...' : 'Create Employee'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel: Geocam Captures */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">Geocam Captures</h2>
            <button onClick={() => refetchCaptures()} className="text-sm px-3 py-1 rounded border border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300">Refresh</button>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Search Captures</label>
            <input
              type="text"
              placeholder="Search by name, employee name, or role..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Filter Buttons */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => { setFilterStatus('all'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded text-sm font-medium transition ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600'}`}
            >
              All
            </button>
            <button
              onClick={() => { setFilterStatus('pending'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded text-sm font-medium transition ${filterStatus === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600'}`}
            >
              Pending
            </button>
            <button
              onClick={() => { setFilterStatus('used'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded text-sm font-medium transition ${filterStatus === 'used' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600'}`}
            >
              Clicked
            </button>
            <button
              onClick={() => { setFilterStatus('expired'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded text-sm font-medium transition ${filterStatus === 'expired' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600'}`}
            >
              Expired
            </button>
          </div>

          {/* Captures Count */}
          <div className="mb-3 flex items-center justify-between text-sm">
            <div className="text-gray-600 dark:text-gray-400">
              Total: <strong>{pagination.total}</strong> capture{pagination.total !== 1 ? 's' : ''} | Page <strong>{pagination.page}</strong> of <strong>{pagination.pages}</strong>
            </div>
          </div>

          {/* Captures Grid - 2 columns */}
          <div className="mb-4">
            {captures.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No matching captures found.' : 'No captures available.'}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {captures.map((cap) => (
                <div 
                  key={cap._id} 
                  className={`border rounded p-4 transition ${selectedCapture?._id===cap._id?'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20':'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'}`}
                >
                  {/* Image Container */}
                  <div className="relative group mb-3 w-full">
                    <img 
                      src={cap.capture?.imageUrl} 
                      alt="cap" 
                      className="w-full h-56 object-cover rounded cursor-move" 
                      draggable="true"
                      onDragStart={(e) => {
                        e.dataTransfer.setData('captureId', cap._id);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`text-xs px-2 py-1 rounded text-white font-semibold ${cap.status === 'used' ? 'bg-green-600' : cap.status === 'pending' ? 'bg-yellow-600' : 'bg-red-600'}`}>
                        {cap.status || 'unknown'}
                      </span>
                    </div>
                    <button
                      onClick={()=>{
                        setSelectedCapture(cap);
                        setProfilePreview(cap.capture?.imageUrl || '');
                        if (cap.capture?.address?.formatted) {
                          formik.setFieldValue('location', cap.capture.address.formatted);
                        }
                        toast.success('Profile image and location set');
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <CheckCircle className="text-white" style={{ fontSize: '36px' }} />
                    </button>
                  </div>

                  {/* Info Section */}
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Name</label>
                      <p className="text-sm text-gray-900 dark:text-white truncate font-medium">{cap.employeeName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Role</label>
                      <p className="text-sm text-gray-900 dark:text-white">{cap.role || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Created</label>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{new Date(cap.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-xs space-y-0.5 text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-slate-600 pt-2">
                      {cap.capture?.address?.formatted && <div><strong>Loc:</strong> <span className="truncate">{cap.capture.address.formatted}</span></div>}
                      {cap.capture?.lat && <div><strong>Coords:</strong> {cap.capture.lat.toFixed(4)}, {cap.capture.lon.toFixed(4)}</div>}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 flex gap-2">
                    <button 
                      onClick={()=>{
                        setSelectedCapture(cap);
                        setProfilePreview(cap.capture?.imageUrl || '');
                        if (cap.capture?.address?.formatted) {
                          formik.setFieldValue('location', cap.capture.address.formatted);
                        }
                        toast.success('Profile image and location set');
                      }} 
                      className="flex-1 px-2 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                    >
                      Use For This Employee
                    </button>
                    <button 
                      onClick={() => handleDeleteCapture(cap._id)}
                      className="flex-1 px-2 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-300 dark:bg-slate-600 text-gray-900 dark:text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {pagination.pages}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                disabled={currentPage === pagination.pages}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </div>
        </div>

        {/* Generate Link Modal */}
        {isGenOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 w-full max-w-md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Generate Geocam Link</h3>
                <button onClick={()=>setIsGenOpen(false)} className="text-sm text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300">Close</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Employee Name</label>
                  <input value={genName} onChange={(e)=>setGenName(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Role</label>
                  <select value={genRole} onChange={(e)=>setGenRole(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
                    <option value="Agent">Agent</option>
                    <option value="QA">QA</option>
                    <option value="TL">TL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Expires (minutes)</label>
                  <input type="number" value={genExpires} onChange={(e)=>setGenExpires(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                </div>
                <button disabled={genLoading} onClick={handleGenerate} className="w-full py-2 bg-indigo-600 text-white rounded disabled:opacity-50">{genLoading?'Generating…':'Generate'}</button>
                {genData?.data?.link && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Link</div>
                    <div className="flex gap-2">
                      <input readOnly value={genData.data.link} className="flex-1 border border-gray-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                      <button onClick={()=>{navigator.clipboard.writeText(genData.data.link); toast.success('Copied');}} className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-600">Copy</button>
                      <a href={genData.data.link} target="_blank" className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Open</a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateEmployee;
