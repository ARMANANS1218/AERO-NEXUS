import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Edit2, Save, X, History, Package, ExternalLink, Eye, AlertCircle, CheckCircle, Clock, XCircle, Trash2 } from 'lucide-react';
import Select from 'react-select';
import { Country, State, City } from 'country-state-city';
import { format } from 'date-fns';

export default function CustomerDetails() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'queries', 'plans'
  const [queryHistory, setQueryHistory] = useState([]);
  const [planHistory, setPlanHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editPlanData, setEditPlanData] = useState(null);
  const [showDeletePlanModal, setShowDeletePlanModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);

  // Address dropdowns
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [formData, setFormData] = useState({
    customerId: '',
    name: '',
    email: '',
    mobile: '',
    alternatePhone: '',
    governmentId: {
      type: '',
      number: '',
      issuedDate: '',
      expiryDate: ''
    },
    address: {
      street: '',
      locality: '',
      city: '',
      state: '',
      country: '',
      countryCode: '',
      stateCode: '',
      postalCode: '',
      landmark: ''
    },
    planType: '',
    billingType: '',
    billingCycle: '',
    validityPeriod: '',
    activationDate: '',
    deactivationDate: '',
    serviceStatus: 'Active'
  });

  // Get countries
  const countries = Country.getAllCountries().map(country => ({
    value: country.isoCode,
    label: country.name,
    name: country.name,
    isoCode: country.isoCode
  }));

  // Fetch customer data
  useEffect(() => {
    if (customerId) {
      fetchCustomerData();
    }
  }, [customerId]);

  // Update states when country changes (only clear if country is removed)
  useEffect(() => {
    if (selectedCountry) {
      const countryStates = State.getStatesOfCountry(selectedCountry.isoCode).map(state => ({
        value: state.isoCode,
        label: state.name,
        name: state.name,
        isoCode: state.isoCode,
        countryCode: state.countryCode
      }));
      setStates(countryStates);
    } else {
      setStates([]);
      setCities([]);
      setSelectedState(null);
      setSelectedCity(null);
    }
  }, [selectedCountry]);

  // Update cities when state changes (only clear if state is removed)
  useEffect(() => {
    if (selectedCountry && selectedState) {
      const stateCities = City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode).map(city => ({
        value: city.name,
        label: city.name,
        name: city.name
      }));
      setCities(stateCities);
    } else {
      setCities([]);
      setSelectedCity(null);
    }
  }, [selectedState, selectedCountry]);

  // Load query and plan history when tab changes
  useEffect(() => {
    if (customerId) {
      if (activeTab === 'queries') {
        fetchQueryHistory();
      } else if (activeTab === 'plans') {
        fetchPlanHistory();
      }
    }
  }, [activeTab, customerId]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/customer/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.status) {
        const customer = data.data;
        setCustomerData(customer);
        
        setFormData({
          customerId: customer.customerId || '',
          name: customer.name || '',
          email: customer.email || '',
          mobile: customer.mobile || '',
          alternatePhone: customer.alternatePhone || '',
          governmentId: {
            type: customer.governmentId?.type || '',
            number: customer.governmentId?.number || '',
            issuedDate: customer.governmentId?.issuedDate ? customer.governmentId.issuedDate.split('T')[0] : '',
            expiryDate: customer.governmentId?.expiryDate ? customer.governmentId.expiryDate.split('T')[0] : ''
          },
          address: {
            street: customer.address?.street || '',
            locality: customer.address?.locality || '',
            city: customer.address?.city || '',
            state: customer.address?.state || '',
            country: customer.address?.country || '',
            countryCode: customer.address?.countryCode || '',
            stateCode: customer.address?.stateCode || '',
            postalCode: customer.address?.postalCode || '',
            landmark: customer.address?.landmark || ''
          },
          planType: customer.planType || '',
          billingType: customer.billingType || '',
          billingCycle: customer.billingCycle || '',
          validityPeriod: customer.validityPeriod || '',
          activationDate: customer.activationDate ? customer.activationDate.split('T')[0] : '',
          deactivationDate: customer.deactivationDate ? customer.deactivationDate.split('T')[0] : '',
          serviceStatus: customer.serviceStatus || 'Active'
        });

        // Set dropdowns
        let foundCountry = null;
        if (customer.address?.countryCode) {
          foundCountry = countries.find(c => c.isoCode === customer.address.countryCode);
        } else if (customer.address?.country) {
          foundCountry = countries.find(c => c.name.toLowerCase() === customer.address.country.toLowerCase());
        }
        
        if (foundCountry) {
          setSelectedCountry(foundCountry);
          
          const countryStates = State.getStatesOfCountry(foundCountry.isoCode).map(state => ({
            value: state.isoCode,
            label: state.name,
            name: state.name,
            isoCode: state.isoCode,
            countryCode: state.countryCode
          }));
          setStates(countryStates);
        }

        // Set state dropdown
        if (foundCountry) {
          let foundState = null;
          const countryCode = foundCountry.isoCode;
          const statesList = State.getStatesOfCountry(countryCode);
          
          if (customer.address?.stateCode) {
            foundState = statesList.find(s => s.isoCode === customer.address.stateCode);
          } else if (customer.address?.state) {
            foundState = statesList.find(s => s.name.toLowerCase() === customer.address.state.toLowerCase());
            
            if (!foundState) {
              foundState = statesList.find(s => 
                s.name.toLowerCase().includes(customer.address.state.toLowerCase()) ||
                customer.address.state.toLowerCase().includes(s.name.toLowerCase())
              );
            }
          }
          
          if (foundState) {
            const stateObj = {
              value: foundState.isoCode,
              label: foundState.name,
              name: foundState.name,
              isoCode: foundState.isoCode,
              countryCode: foundState.countryCode
            };
            setSelectedState(stateObj);
            
            const stateCities = City.getCitiesOfState(countryCode, foundState.isoCode).map(city => ({
              value: city.name,
              label: city.name,
              name: city.name
            }));
            setCities(stateCities);
          }
        }

        if (customer.address?.city) {
          setSelectedCity({
            value: customer.address.city,
            label: customer.address.city,
            name: customer.address.city
          });
        }
      }
    } catch (error) {
      console.error('Failed to load customer:', error);
      toast.error('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const fetchQueryHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/customer/${customerId}/query-history`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const data = await response.json();
      if (data.status) {
        setQueryHistory(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch query history:', error);
      toast.error('Failed to load query history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchPlanHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/customer/${customerId}/plan-history`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const data = await response.json();
      if (data.status) {
        setPlanHistory(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch plan history:', error);
      toast.error('Failed to load plan history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/customer/${customerId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(formData)
        }
      );
      
      const data = await response.json();
      if (data.status) {
        toast.success('Customer updated successfully');
        setIsEditMode(false);
        fetchCustomerData();
      } else {
        toast.error(data.message || 'Failed to update customer');
      }
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast.error('Failed to update customer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCountryChange = (selectedOption) => {
    setSelectedCountry(selectedOption);
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        country: selectedOption?.name || '',
        countryCode: selectedOption?.isoCode || '',
        state: '',
        stateCode: '',
        city: ''
      }
    }));
  };

  const handleStateChange = (selectedOption) => {
    setSelectedState(selectedOption);
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        state: selectedOption?.name || '',
        stateCode: selectedOption?.isoCode || '',
        city: ''
      }
    }));
  };

  const handleCityChange = (selectedOption) => {
    setSelectedCity(selectedOption);
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        city: selectedOption?.name || ''
      }
    }));
  };

  const handleEditPlan = (plan) => {
    setEditingPlanId(plan._id);
    setEditPlanData({
      planType: plan.planType,
      billingType: plan.billingType,
      billingCycle: plan.billingCycle,
      validityPeriod: plan.validityPeriod,
      activationDate: plan.activationDate ? new Date(plan.activationDate).toISOString().split('T')[0] : '',
      deactivationDate: plan.deactivationDate ? new Date(plan.deactivationDate).toISOString().split('T')[0] : '',
      serviceStatus: plan.serviceStatus,
      notes: plan.notes || ''
    });
  };

  const handleUpdatePlan = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/customer/${customerId}/plan/${editingPlanId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(editPlanData)
        }
      );
      const data = await response.json();
      if (data.status) {
        toast.success('Plan updated successfully');
        setEditingPlanId(null);
        setEditPlanData(null);
        fetchPlanHistory();
      } else {
        toast.error(data.message || 'Failed to update plan');
      }
    } catch (error) {
      toast.error('Failed to update plan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlan = (planId) => {
    setPlanToDelete(planId);
    setShowDeletePlanModal(true);
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/customer/${customerId}/plan/${planToDelete}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const data = await response.json();
      if (data.status) {
        toast.success('Plan deleted successfully');
        fetchPlanHistory();
      } else {
        toast.error(data.message || 'Failed to delete plan');
      }
    } catch (error) {
      toast.error('Failed to delete plan');
    } finally {
      setShowDeletePlanModal(false);
      setPlanToDelete(null);
    }
  };

  const handleEditPlanChange = (e) => {
    const { name, value } = e.target;
    setEditPlanData(prev => ({ ...prev, [name]: value }));
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Pending': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: <Clock size={14} /> },
      'Accepted': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: <CheckCircle size={14} /> },
      'In Progress': { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: <AlertCircle size={14} /> },
      'Resolved': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: <CheckCircle size={14} /> },
      'Expired': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200', icon: <XCircle size={14} /> },
      'Transferred': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: <AlertCircle size={14} /> },
      'Active': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: <CheckCircle size={14} /> },
      'Inactive': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200', icon: <XCircle size={14} /> },
      'Suspended': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: <AlertCircle size={14} /> },
    };
    return badges[status] || badges['Pending'];
  };

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff',
      borderColor: state.isFocused ? '#0d9488' : (document.documentElement.classList.contains('dark') ? '#4b5563' : '#d1d5db'),
      color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#111827',
      minHeight: '38px',
      boxShadow: state.isFocused ? '0 0 0 1px #0d9488' : 'none',
      '&:hover': { borderColor: '#0d9488' }
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff',
      border: `1px solid ${document.documentElement.classList.contains('dark') ? '#4b5563' : '#d1d5db'}`,
      zIndex: 9999
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#0d9488' : state.isFocused ? (document.documentElement.classList.contains('dark') ? '#4b5563' : '#f3f4f6') : 'transparent',
      color: state.isSelected ? 'white' : (document.documentElement.classList.contains('dark') ? '#ffffff' : '#111827'),
      cursor: 'pointer',
      '&:active': { backgroundColor: '#0f766e' }
    }),
    singleValue: (base) => ({ 
      ...base, 
      color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#111827'
    }),
    input: (base) => ({ 
      ...base, 
      color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#111827'
    }),
    placeholder: (base) => ({ 
      ...base, 
      color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'
    })
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-white">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-white">Customer not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600 dark:text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {customerData.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-white">
                  Customer ID: {customerData.customerId}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isEditMode ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditMode(false);
                      fetchCustomerData();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-950 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    <Save size={18} />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Edit2 size={18} />
                  Edit Customer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-700">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'info'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-white dark:hover:text-gray-300'
              }`}
            >
              Customer Info
            </button>
            <button
              onClick={() => setActiveTab('queries')}
              className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'queries'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-white dark:hover:text-gray-300'
              }`}
            >
              <History size={16} />
              Query History
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'plans'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-white dark:hover:text-gray-300'
              }`}
            >
              <Package size={16} />
              Plan History
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'info' && (
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm p-6 space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile *</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alternate Phone</label>
                  <input
                    type="tel"
                    name="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Government ID */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Government ID</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Type</label>
                  <select
                    name="governmentId.type"
                    value={formData.governmentId.type}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  >
                    <option value="">Select ID Type</option>
                    <option value="Aadhaar">Aadhaar</option>
                    <option value="PAN">PAN</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Number</label>
                  <input
                    type="text"
                    name="governmentId.number"
                    value={formData.governmentId.number}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Date</label>
                  <input
                    type="date"
                    name="governmentId.issuedDate"
                    value={formData.governmentId.issuedDate}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    name="governmentId.expiryDate"
                    value={formData.governmentId.expiryDate}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                  <Select
                    value={selectedCountry}
                    onChange={handleCountryChange}
                    options={countries}
                    styles={selectStyles}
                    isDisabled={!isEditMode}
                    placeholder="Select Country"
                    isClearable
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                  <Select
                    value={selectedState}
                    onChange={handleStateChange}
                    options={states}
                    styles={selectStyles}
                    isDisabled={!isEditMode || !selectedCountry}
                    placeholder="Select State"
                    isClearable
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <Select
                    value={selectedCity}
                    onChange={handleCityChange}
                    options={cities}
                    styles={selectStyles}
                    isDisabled={!isEditMode || !selectedState}
                    placeholder="Select City"
                    isClearable
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Postal Code</label>
                  <input
                    type="text"
                    name="address.postalCode"
                    value={formData.address.postalCode}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Street</label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Locality</label>
                  <input
                    type="text"
                    name="address.locality"
                    value={formData.address.locality}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Landmark</label>
                  <input
                    type="text"
                    name="address.landmark"
                    value={formData.address.landmark}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Plan Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Plan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Type</label>
                  <input
                    type="text"
                    name="planType"
                    value={formData.planType}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Type</label>
                  <select
                    name="billingType"
                    value={formData.billingType}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  >
                    <option value="">Select</option>
                    <option value="Prepaid">Prepaid</option>
                    <option value="Postpaid">Postpaid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Cycle</label>
                  <select
                    name="billingCycle"
                    value={formData.billingCycle}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  >
                    <option value="">Select</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half Yearly">Half Yearly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Validity (days)</label>
                  <input
                    type="number"
                    name="validityPeriod"
                    value={formData.validityPeriod}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Activation Date</label>
                  <input
                    type="date"
                    name="activationDate"
                    value={formData.activationDate}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deactivation Date</label>
                  <input
                    type="date"
                    name="deactivationDate"
                    value={formData.deactivationDate}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service Status</label>
                  <select
                    name="serviceStatus"
                    value={formData.serviceStatus}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'queries' && (
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Query History</h2>
            {isLoadingHistory ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
              </div>
            ) : queryHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-white">
                No query history found
              </div>
            ) : (
              <div className="space-y-3">
                {queryHistory.map((query) => {
                  const badge = getStatusBadge(query.status);
                  
                  return (
                    <div
                      key={query._id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-teal-500 dark:hover:border-teal-500 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                              {badge.icon}
                              {query.status}
                            </span>
                            {query.priority && (
                              <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full">
                                {query.priority}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-white mb-1">
                            <strong>Subject:</strong> {query.subject || 'No subject'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Created: {format(new Date(query.createdAt), 'MMM dd, yyyy hh:mm a')}
                          </p>
                        </div>
                        <button
                          onClick={() => navigate(`../query/${query.petitionId || query._id}`)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Plan History</h2>
            {isLoadingHistory ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
              </div>
            ) : planHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-white">
                No plan history found
              </div>
            ) : (
              <div className="space-y-3">
                {planHistory.map((plan) => {
                  const badge = getStatusBadge(plan.serviceStatus);
                  const isEditing = editingPlanId === plan._id;
                  
                  return (
                    <div
                      key={plan._id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Type</label>
                              <input
                                type="text"
                                name="planType"
                                value={editPlanData.planType}
                                onChange={handleEditPlanChange}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Service Status</label>
                              <select
                                name="serviceStatus"
                                value={editPlanData.serviceStatus}
                                onChange={handleEditPlanChange}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                              >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Suspended">Suspended</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Activation Date</label>
                              <input
                                type="date"
                                name="activationDate"
                                value={editPlanData.activationDate}
                                onChange={handleEditPlanChange}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Deactivation Date</label>
                              <input
                                type="date"
                                name="deactivationDate"
                                value={editPlanData.deactivationDate}
                                onChange={handleEditPlanChange}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                              <textarea
                                name="notes"
                                value={editPlanData.notes}
                                onChange={handleEditPlanChange}
                                rows="2"
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdatePlan}
                              disabled={isSaving}
                              className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                            >
                              {isSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingPlanId(null);
                                setEditPlanData(null);
                              }}
                              className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-950 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                                {badge.icon}
                                {plan.serviceStatus}
                              </span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {plan.planType}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-white space-y-1">
                              <p><strong>Billing:</strong> {plan.billingType} - {plan.billingCycle}</p>
                              <p><strong>Validity:</strong> {plan.validityPeriod} days</p>
                              <p><strong>Active:</strong> {format(new Date(plan.activationDate), 'MMM dd, yyyy')} to {plan.deactivationDate ? format(new Date(plan.deactivationDate), 'MMM dd, yyyy') : 'N/A'}</p>
                              {plan.notes && <p><strong>Notes:</strong> {plan.notes}</p>}
                              <p className="text-xs text-gray-500">
                                Added: {format(new Date(plan.addedAt), 'MMM dd, yyyy hh:mm a')}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditPlan(plan)}
                              className="p-2 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
                              title="Edit plan"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan._id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete plan"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Plan Confirmation Modal */}
      {showDeletePlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-950 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delete Plan</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this plan? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setShowDeletePlanModal(false);
                  setPlanToDelete(null);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-950 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePlan}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
