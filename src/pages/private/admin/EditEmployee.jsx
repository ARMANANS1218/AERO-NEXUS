import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { CircularProgress, Avatar } from '@mui/material';
import { Visibility, VisibilityOff, ArrowBack } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useUpdateEmployeeMutation } from '../../../features/admin/adminApi';

const EditEmployee = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const employeeData = location.state?.employee;

  const [updateEmployee, { isLoading }] = useUpdateEmployeeMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    role: 'Agent',
    department: '',
    tier: '',
    alias: '',
    address: '',
    employee_id: '',
    profileImage: null,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (employeeData) {
      setFormData({
        name: employeeData.name || '',
        email: employeeData.email || '',
        mobile: employeeData.mobile || '',
        password: '',
        role: employeeData.role || 'Agent',
        department: employeeData.department || '',
        tier: employeeData.tier || '',
        alias: employeeData.alias || '',
        address: employeeData.address || '',
        employee_id: employeeData.employee_id || '',
        profileImage: null,
      });
      if (employeeData.profileImage) {
        setProfilePreview(employeeData.profileImage);
      }
    }
  }, [employeeData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, profileImage: file }));
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.mobile.trim()) newErrors.mobile = 'Mobile is required';
    else if (!/^\d{10}$/.test(formData.mobile)) newErrors.mobile = 'Mobile must be 10 digits';
    // Password is optional for edit
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (['Agent','QA','TL'].includes(formData.role)) {
      if (!formData.department.trim()) newErrors.department = 'Department is required';
      if (!formData.tier.trim()) newErrors.tier = 'Tier is required';
      if (!formData.alias.trim()) newErrors.alias = 'Alias is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix all errors');
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === 'profileImage' && formData[key]) {
          formDataToSend.append('profileImage', formData[key]);
        } else if (key !== 'profileImage' && formData[key]) {
          // Only send password if it's not empty
          if (key === 'password' && !formData[key]) return;
          formDataToSend.append(key, formData[key]);
        }
      });

      await updateEmployee({ id, data: formDataToSend }).unwrap();
      toast.success('Employee updated successfully!');
      navigate('/admin/employees');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update employee');
    }
  };

  if (!employeeData) {
    return (
      <div className="flex justify-center items-center h-96">
        <CircularProgress className="text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => navigate('/admin/employees')}
          className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowBack />
        </button>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Edit Employee</h1>
      </div>

      <div className="max-w-4xl bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image */}
          <div className="flex flex-col items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <Avatar
              src={profilePreview}
              alt={formData.name}
              sx={{ width: 100, height: 100 }}
              className="bg-blue-500"
            >
              {formData.name.charAt(0)}
            </Avatar>
            <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Upload New Photo
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.name
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-slate-600'
                } bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
            </div>

            {/* Role (now includes TL) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled
                className={`w-full px-4 py-2 rounded-lg border bg-gray-100 dark:bg-slate-600 cursor-not-allowed
                  border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white`}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mobile *
              </label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.mobile
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-slate-600'
                } bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent`}
              />
              {errors.mobile && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.mobile}</p>}
            </div>

            {/* Employee ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Employee ID
              </label>
              <input
                type="text"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                disabled
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
                  bg-gray-100 dark:bg-slate-600 text-gray-900 dark:text-white cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Employee ID cannot be changed</p>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={(e) => {
                  handleChange(e);
                  const value = e.target.value;
                  if (!['Agent','QA','TL'].includes(value)) {
                    setFormData(prev => ({ ...prev, tier: '', alias: '' }));
                  }
                }}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
                  bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              >
                <option value="Admin">Admin</option>
                <option value="Agent">Agent</option>
                <option value="QA">QA</option>
                <option value="TL">TL</option>
              </select>
            </div>

            {/* Department (only for Agent/QA/TL) */}
            {['Agent','QA','TL'].includes(formData.role) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Department *
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.department
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-slate-600'
                } bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent`}
              />
              {errors.department && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.department}</p>}
            </div>
            )}

            {/* Tier (only for Agent/QA/TL) */}
            {['Agent','QA','TL'].includes(formData.role) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tier *
              </label>
              <select
                name="tier"
                value={formData.tier}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.tier
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-slate-600'
                } bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent`}
              >
                <option value="">Select tier</option>
                <option value="Tier-1">Tier-1</option>
                <option value="Tier-2">Tier-2</option>
                <option value="Tier-3">Tier-3</option>
              </select>
              {errors.tier && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tier}</p>}
            </div>
            )}

            {/* Alias (only for Agent/QA/TL) */}
            {['Agent','QA','TL'].includes(formData.role) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Alias Name *
                <span className="text-xs text-gray-500 dark:text-gray-400 block font-normal">
                  This name will be shown in chat conversations and tickets
                </span>
              </label>
              <input
                type="text"
                name="alias"
                value={formData.alias}
                onChange={handleChange}
                placeholder={`e.g., Agent ${formData.name.split(' ')[0] || 'John'}`}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.alias
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-slate-600'
                } bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent`}
              />
              {errors.alias && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.alias}</p>}
            </div>
            )}
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password (Leave blank to keep current)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.password
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-slate-600'
                  } bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                >
                  {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
                  bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {isLoading ? <CircularProgress size={20} className="text-white" /> : 'Update Employee'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/employees')}
              className="px-6 py-3 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 
                hover:bg-gray-300 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployee;
