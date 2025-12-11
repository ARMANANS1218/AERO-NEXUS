import React, { useState, useContext } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import ColorModeContext from '../../context/ColorModeContext';
import { FaTimes, FaSpinner, FaCheckCircle, FaCopy, FaCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const CreateOrganizationModal = ({ onClose, onSuccess }) => {
  const { getAuthHeaders } = useSuperAdmin();
  const { mode } = useContext(ColorModeContext);
  const isDark = mode === 'dark';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    domain: '',
    subdomain: '',
    adminEmail: '',
    contactEmail: '',
    contactPhone: '',
    plan: 'basic',
  });

  const [features, setFeatures] = useState({
    chat: { enabled: true, maxConcurrentChats: 50 },
    email: { enabled: false, maxEmailsPerMonth: 1000 },
    query: { enabled: true, maxQueriesPerMonth: 500 },
    videoCalls: { enabled: false, maxCallsPerMonth: 100 },
    audioCalls: { enabled: false, maxCallsPerMonth: 200 },
    analytics: { enabled: false, advancedReports: false },
    customBranding: { enabled: false, whiteLabel: false },
    apiAccess: { enabled: false, rateLimitPerMinute: 60 },
    integrations: { enabled: false, webhooks: false },
    aiChatbot: { enabled: false, monthlyMessages: 1000 },
    fileSharing: { enabled: false, maxFileSize: 5, totalStorage: 100 },
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handlePlanChange = (plan) => {
    setFormData({ ...formData, plan });
    
    // Auto-configure features based on plan
    switch (plan) {
      case 'trial':
      case 'basic':
        setFeatures({
          ...features,
          chat: { enabled: true, maxConcurrentChats: 25 },
          query: { enabled: true, maxQueriesPerMonth: 250 },
          email: { enabled: false },
          videoCalls: { enabled: false },
          audioCalls: { enabled: false },
        });
        break;
      case 'professional':
        setFeatures({
          ...features,
          chat: { enabled: true, maxConcurrentChats: 100 },
          email: { enabled: true, maxEmailsPerMonth: 2000 },
          query: { enabled: true, maxQueriesPerMonth: 1000 },
          videoCalls: { enabled: true, maxCallsPerMonth: 200 },
          audioCalls: { enabled: true, maxCallsPerMonth: 300 },
          analytics: { enabled: true, advancedReports: false },
        });
        break;
      case 'enterprise':
        setFeatures({
          chat: { enabled: true, maxConcurrentChats: 500 },
          email: { enabled: true, maxEmailsPerMonth: 10000 },
          query: { enabled: true, maxQueriesPerMonth: 5000 },
          videoCalls: { enabled: true, maxCallsPerMonth: 1000 },
          audioCalls: { enabled: true, maxCallsPerMonth: 2000 },
          analytics: { enabled: true, advancedReports: true },
          customBranding: { enabled: true, whiteLabel: true },
          apiAccess: { enabled: true, rateLimitPerMinute: 120 },
          integrations: { enabled: true, webhooks: true },
          aiChatbot: { enabled: true, monthlyMessages: 10000 },
          fileSharing: { enabled: true, maxFileSize: 50, totalStorage: 1000 },
        });
        break;
      default:
        break;
    }
  };

  const toggleFeature = (featureName) => {
    setFeatures({
      ...features,
      [featureName]: {
        ...features[featureName],
        enabled: !features[featureName].enabled,
      },
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedApiKey(true);
      toast.success('API Key copied to clipboard!');
      setTimeout(() => setCopiedApiKey(false), 2000);
    }).catch(() => {
      toast.error('Failed to copy API Key');
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        features,
      };

      const response = await axios.post(
        `${API_URL}/api/v1/superadmin/organizations/create`,
        payload,
        getAuthHeaders()
      );

      if (response.data.status) {
        setSuccess(response.data.data);
        toast.success('Organization created successfully!');
        
        // Don't auto-navigate - let user copy API key first
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create organization';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`fixed inset-0 ${isDark ? 'bg-black bg-opacity-60' : 'bg-black bg-opacity-50'} flex items-center justify-center p-2 z-50`}>
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto`}>
          <div className="text-center">
            <div className={`mx-auto w-16 h-16 ${isDark ? 'bg-green-900' : 'bg-green-100'} rounded-full flex items-center justify-center mb-4`}>
              <FaCheckCircle className="text-3xl text-green-600" />
            </div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-4`}>Organization Created!</h2>
            
            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-6 mb-6 text-left`}>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Organization ID:</p>
              <p className={`font-mono font-bold ${isDark ? 'text-violet-400' : 'text-violet-600'} mb-4`}>{success.organization?.organizationId}</p>
              
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>API Key (Save this!):</p>
              <div className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-yellow-50 border-yellow-200'} border p-3 rounded-lg`}>
                <div className="flex items-center justify-between gap-2">
                  <p className={`font-mono text-sm break-all ${isDark ? 'text-gray-300' : 'text-gray-800'} flex-1`}>{success.apiKey}</p>
                  <button
                    onClick={() => copyToClipboard(success.apiKey)}
                    className={`flex-shrink-0 p-2 rounded-lg transition ${
                      copiedApiKey 
                        ? 'bg-green-500 text-white' 
                        : isDark 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                    title="Copy API Key"
                  >
                    {copiedApiKey ? <FaCheck /> : <FaCopy />}
                  </button>
                </div>
              </div>
              <p className={`text-xs ${isDark ? 'text-yellow-400' : 'text-yellow-600'} mt-2`}>
                ⚠️ This API key will only be shown once. Please copy and save it securely.
              </p>
              
              {success.setupUrl && (
                <>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2 mt-4`}>Setup URL:</p>
                  <p className={isDark ? 'text-violet-400 font-medium' : 'text-violet-600 font-medium'}>{success.setupUrl}</p>
                </>
              )}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  navigate(`/superadmin/organizations/${success.organization._id}`);
                  onSuccess();
                }}
                className={`${isDark ? 'bg-violet-600 hover:bg-violet-700' : 'bg-violet-600 hover:bg-violet-700'} text-white px-6 py-3 rounded-lg font-medium`}
              >
                View Details
              </button>
              <button
                onClick={onSuccess}
                className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} px-6 py-3 rounded-lg font-medium`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 ${isDark ? 'bg-black bg-opacity-60' : 'bg-black bg-opacity-50'} flex items-center justify-center p-2 z-50`}>
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`sticky top-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4 flex items-center justify-between`}>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Create New Organization</h2>
          <button
            onClick={onClose}
            className={`p-2 ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} rounded-lg transition`}
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className={`mb-4 p-2 border rounded-lg ${isDark ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="mb-6">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mb-4`}>Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Organization Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 bg-white'}`}
                  placeholder="XYZ Company"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 bg-white'}`}
                  placeholder="XYZ"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Domain
                </label>
                <input
                  type="text"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 bg-white'}`}
                  placeholder="xyz.com"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Subdomain
                </label>
                <input
                  type="text"
                  name="subdomain"
                  value={formData.subdomain}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 bg-white'}`}
                  placeholder="xyz"
                />
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Will be: {formData.subdomain || 'xyz'}.chatcrm.com</p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Admin Email *
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 bg-white'}`}
                  placeholder="admin@xyz.com"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 bg-white'}`}
                  placeholder="support@xyz.com"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 bg-white'}`}
                  placeholder="+1234567890"
                />
              </div>
            </div>
          </div>

          {/* Subscription Plan */}
          <div className="mb-6">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mb-4`}>Subscription Plan</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {['trial', 'basic', 'professional', 'enterprise', 'custom'].map((plan) => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => handlePlanChange(plan)}
                  className={`p-2 border-2 rounded-lg font-medium capitalize transition ${
                    formData.plan === plan
                      ? isDark ? 'border-violet-400 bg-violet-900 text-violet-200' : 'border-violet-600 bg-violet-50 text-violet-700'
                      : isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {plan}
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mb-4`}>Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(features).map(([key, value]) => (
                <div
                  key={key}
                  className={`p-2 border-2 rounded-lg cursor-pointer transition ${
                    value.enabled
                      ? isDark ? 'border-green-600 bg-green-900' : 'border-green-500 bg-green-50'
                      : isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleFeature(key)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium capitalize ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className={`w-12 h-6 rounded-full transition ${
                      value.enabled ? isDark ? 'bg-green-600' : 'bg-green-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                    }`}>
                      <div className={`w-5 h-5 ${isDark ? 'bg-gray-200' : 'bg-white'} rounded-full shadow-md transform transition ${
                        value.enabled ? 'translate-x-6' : 'translate-x-1'
                      } mt-0.5`} />
                    </div>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {value.enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className={`flex gap-3 justify-end pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 border rounded-lg font-medium transition ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 ${isDark ? 'bg-violet-600 hover:bg-violet-700' : 'bg-violet-600 hover:bg-violet-700'} text-white rounded-lg font-medium flex items-center transition disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Organization'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrganizationModal;
