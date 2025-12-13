import React, { useState, useEffect } from 'react';
import { 
  X, Save, Search, User, Phone, Mail, MapPin, CreditCard, 
  Calendar, FileText, Building, Hash, Globe, Edit2, ChevronLeft, ChevronRight, Plus
} from 'lucide-react';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { Country, State, City } from 'country-state-city';

export default function CustomerDetailsPanel({ 
  isOpen, 
  onClose, 
  customerId = null,
  queryCustomerInfo = null, // Info from query (name, email from widget)
  onSave 
}) {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [customerList, setCustomerList] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Address selection state
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const initialFormState = {
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
  };

  const [formData, setFormData] = useState(initialFormState);

  // Get all countries for dropdown
  const countries = Country.getAllCountries().map(country => ({
    value: country.isoCode,
    label: country.name,
    name: country.name,
    isoCode: country.isoCode
  }));

  // Reset form to initial state
  const resetForm = () => {
    setFormData(initialFormState);
    setSelectedCountry(null);
    setSelectedState(null);
    setSelectedCity(null);
    setSelectedCustomerId(null);
    setIsEditMode(false);
    setIsCreatingNew(false);
  };

  // Load recent customers on mount
  useEffect(() => {
    if (isOpen && !isSearchMode) {
      fetchRecentCustomers();
    }
  }, [isOpen, currentPage, itemsPerPage]);

  // Initialize with query customer info if available
  useEffect(() => {
    if (queryCustomerInfo && !customerId) {
      setFormData(prev => ({
        ...prev,
        name: queryCustomerInfo.name || '',
        email: queryCustomerInfo.email || '',
        mobile: queryCustomerInfo.mobile || ''
      }));
    }
  }, [queryCustomerInfo, customerId]);

  // Update states when country changes
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
      setCities([]);
      setSelectedState(null);
      setSelectedCity(null);
    } else {
      setStates([]);
      setCities([]);
    }
  }, [selectedCountry]);

  // Update cities when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      const stateCities = City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode).map(city => ({
        value: city.name,
        label: city.name,
        name: city.name
      }));
      setCities(stateCities);
      setSelectedCity(null);
    } else {
      setCities([]);
    }
  }, [selectedState, selectedCountry]);

  // Load existing customer data if customerId provided
  useEffect(() => {
    if (customerId && isOpen) {
      fetchCustomerData(customerId);
    }
  }, [customerId, isOpen]);

  const fetchCustomerData = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/customer/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.status) {
        const customerData = data.data;
        setFormData({
          customerId: customerData.customerId || '',
          name: customerData.name || '',
          email: customerData.email || '',
          mobile: customerData.mobile || '',
          alternatePhone: customerData.alternatePhone || '',
          governmentId: customerData.governmentId || {
            type: '',
            number: '',
            issuedDate: '',
            expiryDate: ''
          },
          address: customerData.address || {
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
          planType: customerData.planType || '',
          billingType: customerData.billingType || '',
          billingCycle: customerData.billingCycle || '',
          validityPeriod: customerData.validityPeriod || '',
          activationDate: customerData.activationDate ? customerData.activationDate.split('T')[0] : '',
          deactivationDate: customerData.deactivationDate ? customerData.deactivationDate.split('T')[0] : '',
          serviceStatus: customerData.serviceStatus || 'Active'
        });

        // Set selected country, state, city for dropdowns
        if (customerData.address?.countryCode) {
          const country = countries.find(c => c.isoCode === customerData.address.countryCode);
          if (country) setSelectedCountry(country);
        }
        if (customerData.address?.stateCode && customerData.address?.countryCode) {
          const statesList = State.getStatesOfCountry(customerData.address.countryCode);
          const state = statesList.find(s => s.isoCode === customerData.address.stateCode);
          if (state) {
            setSelectedState({
              value: state.isoCode,
              label: state.name,
              name: state.name,
              isoCode: state.isoCode,
              countryCode: state.countryCode
            });
          }
        }
        if (customerData.address?.city) {
          setSelectedCity({
            value: customerData.address.city,
            label: customerData.address.city,
            name: customerData.address.city
          });
        }
      }
    } catch (error) {
      toast.error('Failed to load customer data');
    }
  };

  const fetchRecentCustomers = async () => {
    setIsLoadingList(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/customer/list?page=${currentPage}&limit=${itemsPerPage}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const data = await response.json();
      if (data.status) {
        setCustomerList(data.data || []);
        setTotalCustomers(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearchMode(false);
      fetchRecentCustomers();
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/customer/search?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const data = await response.json();
      if (data.status) {
        setSearchResults(data.data || []);
        if (data.data.length === 0) {
          toast.info('No customers found');
        }
      }
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomerId(customer._id);
    setIsEditMode(false); // Start in view mode
    setIsCreatingNew(false);
    setFormData({
      customerId: customer.customerId || '',
      name: customer.name || '',
      email: customer.email || '',
      mobile: customer.mobile || '',
      alternatePhone: customer.alternatePhone || '',
      governmentId: customer.governmentId || {
        type: '',
        number: '',
        issuedDate: '',
        expiryDate: ''
      },
      address: customer.address || {
        street: '',
        locality: '',
        city: '',
        state: '',
        country: 'India',
        postalCode: '',
        landmark: ''
      },
      planType: customer.planType || '',
      billingType: customer.billingType || '',
      billingCycle: customer.billingCycle || '',
      validityPeriod: customer.validityPeriod || '',
      activationDate: customer.activationDate ? customer.activationDate.split('T')[0] : '',
      deactivationDate: customer.deactivationDate ? customer.deactivationDate.split('T')[0] : '',
      serviceStatus: customer.serviceStatus || 'Active'
    });
    setIsSearchMode(false);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Handle country selection
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

  // Handle state selection
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

  // Handle city selection
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

  // Validate pincode based on country
  const validatePostalCode = (postalCode, countryCode) => {
    if (!postalCode) return true; // Optional field
    
    const patterns = {
      IN: /^[1-9][0-9]{5}$/, // India: 6 digits
      US: /^[0-9]{5}(-[0-9]{4})?$/, // USA: 5 or 5+4 digits
      GB: /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i, // UK
      CA: /^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/i, // Canada
      AU: /^[0-9]{4}$/, // Australia: 4 digits
      JP: /^[0-9]{3}-[0-9]{4}$/, // Japan: XXX-XXXX
      CN: /^[0-9]{6}$/, // China: 6 digits
      BR: /^[0-9]{5}-[0-9]{3}$/, // Brazil: XXXXX-XXX
      DE: /^[0-9]{5}$/, // Germany: 5 digits
      FR: /^[0-9]{5}$/, // France: 5 digits
    };

    const pattern = patterns[countryCode];
    if (pattern) {
      return pattern.test(postalCode);
    }
    
    // Default: allow alphanumeric and spaces
    return /^[A-Z0-9\s-]{3,10}$/i.test(postalCode);
  };

  // Custom styles for react-select to match dark mode
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: 'var(--select-bg)',
      borderColor: state.isFocused ? '#0d9488' : 'var(--select-border)',
      color: 'var(--select-text)',
      minHeight: '38px',
      boxShadow: state.isFocused ? '0 0 0 1px #0d9488' : 'none',
      '&:hover': {
        borderColor: '#0d9488'
      }
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'var(--select-bg)',
      border: '1px solid var(--select-border)',
      zIndex: 9999
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? '#0d9488' 
        : state.isFocused 
        ? 'var(--select-hover)' 
        : 'transparent',
      color: state.isSelected ? 'white' : 'var(--select-text)',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#0f766e'
      }
    }),
    singleValue: (base) => ({
      ...base,
      color: 'var(--select-text)'
    }),
    input: (base) => ({
      ...base,
      color: 'var(--select-text)'
    }),
    placeholder: (base) => ({
      ...base,
      color: 'var(--select-placeholder)'
    })
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.mobile) {
      toast.error('Name, Email, and Mobile are required');
      return;
    }

    setIsSaving(true);
    try {
      const isUpdate = customerId || selectedCustomerId;
      const url = isUpdate
        ? `${import.meta.env.VITE_API_URL}/api/v1/customer/${customerId || selectedCustomerId}`
        : `${import.meta.env.VITE_API_URL}/api/v1/customer/create`;
      
      const method = isUpdate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.status) {
        toast.success(isUpdate ? 'Customer updated successfully' : 'Customer created successfully');
        if (onSave) onSave(data.data);
        if (isEditMode) {
          setIsEditMode(false); // Exit edit mode after save
        }
        if (isCreatingNew) {
          setIsCreatingNew(false); // Exit creation mode after save
        }
        if (!isUpdate) {
          onClose(); // Close panel only on create
        }
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Failed to save customer data');
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
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      <style>{`
        :root {
          --select-bg: white;
          --select-border: #d1d5db;
          --select-hover: #f3f4f6;
          --select-text: #111827;
          --select-placeholder: #9ca3af;
        }
        .dark {
          --select-bg: #1f2937;
          --select-border: #4b5563;
          --select-hover: #374151;
          --select-text: #f9fafb;
          --select-placeholder: #6b7280;
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-slate-800 to-slate-950 text-white">
        <div className="flex items-center gap-2">
          <User size={20} />
          <h3 className="font-semibold text-lg">
            {isSearchMode 
              ? 'Search Customers' 
              : isEditMode 
                ? 'Edit Customer' 
                : selectedCustomerId 
                  ? 'Customer Details' 
                  : queryCustomerInfo || isCreatingNew
                    ? 'Create Customer ID'
                    : 'Customer List'
            }
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {!isSearchMode && selectedCustomerId && !isEditMode && (
            <button
              onClick={() => setIsEditMode(true)}
              className="p-2 hover:bg-teal-800 rounded-lg transition-colors"
              title="Edit Customer"
            >
              <Edit2 size={18} />
            </button>
          )}
          {!isSearchMode && (
            <button
              onClick={() => setIsSearchMode(true)}
              className="p-2 hover:bg-teal-800 rounded-lg transition-colors"
              title="Search Customer"
            >
              <Search size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-teal-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isSearchMode ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name, email, phone, or customer ID..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
              <button
                onClick={() => {
                  setIsSearchMode(false);
                  setSearchResults([]);
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Found {searchResults.length} customer(s)
                </p>
                {searchResults.map((customer) => (
                  <div
                    key={customer._id}
                    onClick={() => handleSelectCustomer(customer)}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{customer.email}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{customer.mobile}</p>
                      </div>
                      {customer.customerId && (
                        <span className="px-2 py-1 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-xs rounded">
                          {customer.customerId}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : !selectedCustomerId && !queryCustomerInfo && !isCreatingNew ? (
          <div className="space-y-4">
            {/* Recent Customers List */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">Recent Customers</h4>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsCreatingNew(true);
                    setSelectedCustomerId(null);
                    setIsEditMode(false);
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1 shadow-md"
                >
                  <Plus size={16} />
                  Create New
                </button>
                <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Per page:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              </div>
            </div>

            {isLoadingList ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : customerList.length > 0 ? (
              <div className="space-y-2">
                {customerList.map((customer) => (
                  <div
                    key={customer._id}
                    onClick={() => handleSelectCustomer(customer)}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{customer.email}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{customer.mobile}</p>
                      </div>
                      {customer.customerId && (
                        <span className="px-2 py-1 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-xs rounded">
                          {customer.customerId}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No customers found
              </div>
            )}

            {/* Pagination Controls */}
            {totalCustomers > 0 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCustomers)} of {totalCustomers} customers
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 flex items-center gap-1"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {Math.ceil(totalCustomers / itemsPerPage)}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCustomers / itemsPerPage), prev + 1))}
                    disabled={currentPage >= Math.ceil(totalCustomers / itemsPerPage)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 flex items-center gap-1"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User size={18} />
                Basic Information
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Customer ID
                  </label>
                  <input
                    type="text"
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    placeholder="Auto-generated (CUST + 8 digits)"
                    readOnly={selectedCustomerId && !isEditMode}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm ${
                      selectedCustomerId && !isEditMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'bg-white dark:bg-gray-800'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mobile <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alternate Phone
                </label>
                <input
                  type="tel"
                  name="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>

            {/* Government ID */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText size={18} />
                Government ID
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ID Type
                  </label>
                  <select
                    name="governmentId.type"
                    value={formData.governmentId.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Select Type</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Passport">Passport</option>
                    <option value="Aadhaar">Aadhaar</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ID Number
                  </label>
                  <input
                    type="text"
                    name="governmentId.number"
                    value={formData.governmentId.number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Issued Date
                  </label>
                  <input
                    type="date"
                    name="governmentId.issuedDate"
                    value={formData.governmentId.issuedDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="governmentId.expiryDate"
                    value={formData.governmentId.expiryDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin size={18} />
                Address
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Street / Building Address
                </label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  placeholder="House No., Street Name, Building"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Country
                  </label>
                  <Select
                    value={selectedCountry}
                    onChange={handleCountryChange}
                    options={countries}
                    placeholder="Select Country"
                    isClearable
                    isSearchable
                    styles={selectStyles}
                    className="text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State / Province
                  </label>
                  <Select
                    value={selectedState}
                    onChange={handleStateChange}
                    options={states}
                    placeholder={selectedCountry ? "Select State" : "Select Country First"}
                    isClearable
                    isSearchable
                    isDisabled={!selectedCountry}
                    styles={selectStyles}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                  </label>
                  <Select
                    value={selectedCity}
                    onChange={handleCityChange}
                    options={cities}
                    placeholder={selectedState ? "Select City" : "Select State First"}
                    isClearable
                    isSearchable
                    isDisabled={!selectedState}
                    styles={selectStyles}
                    className="text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Postal / ZIP Code
                  </label>
                  <input
                    type="text"
                    name="address.postalCode"
                    value={formData.address.postalCode}
                    onChange={(e) => {
                      handleChange(e);
                      const isValid = validatePostalCode(e.target.value, selectedCountry?.isoCode);
                      if (e.target.value && !isValid) {
                        e.target.setCustomValidity('Invalid postal code format for selected country');
                      } else {
                        e.target.setCustomValidity('');
                      }
                    }}
                    placeholder={
                      selectedCountry?.isoCode === 'IN' ? 'e.g., 110001' :
                      selectedCountry?.isoCode === 'US' ? 'e.g., 10001' :
                      selectedCountry?.isoCode === 'GB' ? 'e.g., SW1A 1AA' :
                      selectedCountry?.isoCode === 'CA' ? 'e.g., K1A 0B1' :
                      'Enter postal code'
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                  {selectedCountry?.isoCode === 'IN' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      6 digits (e.g., 110001)
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Locality / Area
                  </label>
                  <input
                    type="text"
                    name="address.locality"
                    value={formData.address.locality}
                    onChange={handleChange}
                    placeholder="Neighborhood, Area"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Landmark
                  </label>
                  <input
                    type="text"
                    name="address.landmark"
                    value={formData.address.landmark}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Service & Billing Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCard size={18} />
                Service & Billing
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plan Type
                  </label>
                  <input
                    type="text"
                    name="planType"
                    value={formData.planType}
                    onChange={handleChange}
                    placeholder="e.g., Premium, Basic"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Billing Type
                  </label>
                  <select
                    name="billingType"
                    value={formData.billingType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Select Type</option>
                    <option value="Prepaid">Prepaid</option>
                    <option value="Postpaid">Postpaid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Billing Cycle
                  </label>
                  <select
                    name="billingCycle"
                    value={formData.billingCycle}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Select Cycle</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Validity Period
                  </label>
                  <input
                    type="text"
                    name="validityPeriod"
                    value={formData.validityPeriod}
                    onChange={handleChange}
                    placeholder="e.g., 30 Days, 1 Year"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Activation Date
                  </label>
                  <input
                    type="date"
                    name="activationDate"
                    value={formData.activationDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deactivation Date
                  </label>
                  <input
                    type="date"
                    name="deactivationDate"
                    value={formData.deactivationDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Service Status
                </label>
                <select
                  name="serviceStatus"
                  value={formData.serviceStatus}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      {!isSearchMode && (selectedCustomerId || isEditMode || queryCustomerInfo || isCreatingNew) && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          {isEditMode || isCreatingNew || (!selectedCustomerId && !queryCustomerInfo) ? (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white rounded-lg transition-all font-medium disabled:opacity-50"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : (isEditMode ? 'Update Customer' : 'Create Customer')}
              </button>
              <button
                onClick={() => {
                  if (isEditMode) {
                    setIsEditMode(false);
                  } else if (isCreatingNew) {
                    setIsCreatingNew(false);
                    resetForm();
                  } else {
                    onClose();
                  }
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </>
          ) : queryCustomerInfo ? (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white rounded-lg transition-all font-medium disabled:opacity-50"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Create Customer'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          )}
        </div>
      )}
    </div>
  );
}
