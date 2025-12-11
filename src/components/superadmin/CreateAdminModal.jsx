import React, { useState, useContext } from 'react';
import { FaTimes, FaUser, FaEnvelope, FaIdCard, FaPhone, FaCopy, FaCheck } from 'react-icons/fa';
import ColorModeContext from '../../context/ColorModeContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { useSuperAdmin } from '../../context/SuperAdminContext';

const CreateAdminModal = ({ isOpen, onClose, organizationId, organizationName, onSuccess }) => {
  const { mode } = useContext(ColorModeContext);
  const { getAuthHeaders } = useSuperAdmin();
  const isDark = mode === 'dark';

  const [formData, setFormData] = useState({
    name: '',
    user_name: '',
    email: '',
    employee_id: '',
    mobile: '',
    customPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [useCustomPassword, setUseCustomPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.user_name || !formData.email || !formData.employee_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/v1/superadmin/organizations/${organizationId}/admin/create`,
        formData,
        getAuthHeaders()
      );

      if (response.data.status) {
        setCreatedAdmin(response.data.data);
        toast.success('Admin created successfully!');
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create admin';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleClose = () => {
    setFormData({
      name: '',
      user_name: '',
      email: '',
      employee_id: '',
      mobile: '',
      customPassword: ''
    });
    setCreatedAdmin(null);
    setUseCustomPassword(false);
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`sticky top-0 flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} z-10`}>
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {createdAdmin ? '✅ Admin Created Successfully' : 'Create Organization Admin'}
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {organizationName}
            </p>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!createdAdmin ? (
            // Create Form
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaUser className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-violet-500 transition ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaUser className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    name="user_name"
                    value={formData.user_name}
                    onChange={handleChange}
                    placeholder="john_admin"
                    required
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-violet-500 transition ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaEnvelope className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@example.com"
                    required
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-violet-500 transition ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  />
                </div>
              </div>

              {/* Employee ID */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Employee ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaIdCard className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleChange}
                    placeholder="EMP-2001"
                    required
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-violet-500 transition ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  />
                </div>
              </div>

              {/* Mobile (Optional) */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Mobile Number (Optional)
                </label>
                <div className="relative">
                  <FaPhone className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="+1 234 567 8900"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-violet-500 transition ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  />
                </div>
              </div>

              {/* Password Option Toggle */}
              <div className={`p-2 rounded-lg border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomPassword}
                    onChange={(e) => {
                      setUseCustomPassword(e.target.checked);
                      if (!e.target.checked) {
                        setFormData(prev => ({ ...prev, customPassword: '' }));
                      }
                    }}
                    className="w-4 h-4 rounded"
                  />
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Set custom password (otherwise auto-generated)
                  </span>
                </label>
              </div>

              {/* Custom Password Field */}
              {useCustomPassword && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Custom Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="customPassword"
                      value={formData.customPassword}
                      onChange={handleChange}
                      placeholder="Enter custom password"
                      className={`w-full pl-4 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-violet-500 transition ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className={`p-2 rounded-lg border ${isDark ? 'bg-violet-900/20 border-violet-700' : 'bg-violet-50 border-violet-200'}`}>
                <p className={`text-sm ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
                  ℹ️ {useCustomPassword ? 'Your custom password will be displayed after creation.' : 'A temporary password will be generated and displayed after creation.'} Make sure to save it securely.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className={`flex-1 px-4 py-2.5 border rounded-lg font-medium transition ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          ) : (
            // Success View with Credentials
            <div className="space-y-6">
              {/* Success Message */}
              <div className={`p-2 rounded-lg border ${isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'}`}>
                <p className={`font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                  ✅ Admin account created successfully! Share these credentials securely.
                </p>
              </div>

              {/* Credentials */}
              <div className="space-y-4">
                {/* Name */}
                <div className={`p-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Name
                  </label>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {createdAdmin.user.name}
                  </p>
                </div>

                {/* Email */}
                <div className={`p-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Email (Login)
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {createdAdmin.user.email}
                    </p>
                    <button
                      onClick={() => copyToClipboard(createdAdmin.user.email, 'email')}
                      className={`p-2 rounded transition ${
                        copiedField === 'email' 
                          ? 'bg-green-500 text-white' 
                          : isDark 
                            ? 'hover:bg-gray-600 text-gray-400' 
                            : 'hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      {copiedField === 'email' ? <FaCheck /> : <FaCopy />}
                    </button>
                  </div>
                </div>

                {/* Employee ID */}
                <div className={`p-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Employee ID
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {createdAdmin.user.employee_id}
                    </p>
                    <button
                      onClick={() => copyToClipboard(createdAdmin.user.employee_id, 'empId')}
                      className={`p-2 rounded transition ${
                        copiedField === 'empId' 
                          ? 'bg-green-500 text-white' 
                          : isDark 
                            ? 'hover:bg-gray-600 text-gray-400' 
                            : 'hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      {copiedField === 'empId' ? <FaCheck /> : <FaCopy />}
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div className={`p-2 rounded-lg border-2 ${isDark ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-400'}`}>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                    🔑 {createdAdmin.isCustomPassword ? 'Custom Password' : 'Generated Password'} (Save This!)
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <code className={`font-mono text-lg font-bold ${isDark ? 'text-yellow-300' : 'text-yellow-800'}`}>
                      {createdAdmin.tempPassword}
                    </code>
                    <button
                      onClick={() => copyToClipboard(createdAdmin.tempPassword, 'password')}
                      className={`p-2 rounded transition ${
                        copiedField === 'password' 
                          ? 'bg-green-500 text-white' 
                          : isDark 
                            ? 'bg-yellow-700 hover:bg-yellow-600 text-yellow-200' 
                            : 'bg-yellow-200 hover:bg-yellow-300 text-yellow-800'
                      }`}
                    >
                      {copiedField === 'password' ? <FaCheck /> : <FaCopy />}
                    </button>
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                    ⚠️ This password is shown only once. {createdAdmin.isCustomPassword ? 'Make sure to save it securely.' : 'The admin should change it after first login.'}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="w-full px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateAdminModal;
