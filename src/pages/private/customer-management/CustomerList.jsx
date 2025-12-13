import React, { useState, useMemo, useEffect } from 'react';
import { CircularProgress, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip } from '@mui/material';
import { Edit, Search, RefreshCw, Eye, Phone, Mail, MapPin, Calendar, UserCog } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewDialog, setViewDialog] = useState({ open: false, customer: null });
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [hasSearched, setHasSearched] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  // Search customers with debouncing
  const searchCustomers = async (query) => {
    if (!query || query.trim().length < 2) {
      setCustomers([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/customer/search?q=${encodeURIComponent(query.trim())}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status && response.data.data) {
        setCustomers(response.data.data || []);
      } else if (response.data.success && response.data.customers) {
        setCustomers(response.data.customers || []);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Failed to search customers:', error);
      if (error.response?.status !== 400) {
        toast.error('Failed to search customers');
      }
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchCustomers(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Paginated customers (no client-side filtering, API does it)
  const paginatedCustomers = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return customers.slice(startIndex, startIndex + rowsPerPage);
  }, [customers, page, rowsPerPage]);

  const totalPages = Math.ceil(customers.length / rowsPerPage);

  const handleViewCustomer = (customer) => {
    setViewDialog({ open: true, customer });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="h-screen w-full bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-teal-600 to-cyan-700 rounded-lg">
                <UserCog className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Management</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {hasSearched ? `${customers.length} customer${customers.length !== 1 ? 's' : ''} found` : 'Search by name, email, phone, or customer ID'}
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Type at least 2 characters to search customers..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <CircularProgress size={20} style={{ color: '#0d9488' }} />
              </div>
            )}
          </div>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto">

          {/* Empty State */}
          {!hasSearched && !loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Search size={64} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Search for Customers
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Enter at least 2 characters in the search box to find customers
                </p>
              </div>
            </div>
          ) : customers.length === 0 && hasSearched && !loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <UserCog size={64} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No Customers Found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  No customers match your search: "{searchQuery}"
                </p>
              </div>
            </div>
          ) : customers.length > 0 ? (
            <>
              {/* Customer List Table */}
              <div className="bg-white dark:bg-gray-800">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mobile</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedCustomers.map((customer) => (
                      <tr
                        key={customer._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Avatar
                              sx={{
                                bgcolor: '#0d9488',
                                width: 40,
                                height: 40,
                                fontSize: '1rem'
                              }}
                            >
                              {customer.name?.charAt(0).toUpperCase() || 'C'}
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {customer.name || 'Unknown'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs px-2 py-1 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 rounded-full font-mono">
                            {customer.customerId || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Mail size={14} className="flex-shrink-0" />
                            <span className="truncate max-w-xs">{customer.email || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Phone size={14} className="flex-shrink-0" />
                            <span>{customer.mobile || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {customer.address?.city ? (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <MapPin size={14} className="flex-shrink-0" />
                              <span className="truncate max-w-xs">
                                {customer.address.city}, {customer.address.country}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {customer.serviceStatus && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                              ${customer.serviceStatus === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                customer.serviceStatus === 'Inactive' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                                customer.serviceStatus === 'Suspended' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}
                            >
                              {customer.serviceStatus}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar size={14} className="flex-shrink-0" />
                            <span>{formatDate(customer.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Tooltip title="View Details">
                            <IconButton
                              onClick={() => handleViewCustomer(customer)}
                              size="small"
                              className="text-teal-600 hover:bg-teal-50"
                            >
                              <Eye size={18} />
                            </IconButton>
                          </Tooltip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, customers.length)} of {customers.length} customers
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg 
                                 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                        Page {page + 1} of {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg 
                                 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* View Customer Dialog */}
      <Dialog
        open={viewDialog.open}
        onClose={() => setViewDialog({ open: false, customer: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="bg-gradient-to-r from-teal-700 to-cyan-800 text-white">
          <div className="flex items-center gap-3">
            <UserCog size={24} />
            <span>Customer Details</span>
          </div>
        </DialogTitle>
        <DialogContent className="mt-4">
          {viewDialog.customer && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-500 dark:text-gray-400">Customer ID</label>
                    <p className="font-medium text-gray-900 dark:text-white">{viewDialog.customer.customerId || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-500 dark:text-gray-400">Name</label>
                    <p className="font-medium text-gray-900 dark:text-white">{viewDialog.customer.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-500 dark:text-gray-400">Email</label>
                    <p className="font-medium text-gray-900 dark:text-white">{viewDialog.customer.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-500 dark:text-gray-400">Mobile</label>
                    <p className="font-medium text-gray-900 dark:text-white">{viewDialog.customer.mobile || 'N/A'}</p>
                  </div>
                  {viewDialog.customer.alternatePhone && (
                    <div>
                      <label className="text-gray-500 dark:text-gray-400">Alternate Phone</label>
                      <p className="font-medium text-gray-900 dark:text-white">{viewDialog.customer.alternatePhone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              {viewDialog.customer.address && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Address</h3>
                  <div className="text-sm space-y-2">
                    <p className="text-gray-700 dark:text-gray-300">
                      {viewDialog.customer.address.street && `${viewDialog.customer.address.street}, `}
                      {viewDialog.customer.address.locality && `${viewDialog.customer.address.locality}, `}
                      {viewDialog.customer.address.city && `${viewDialog.customer.address.city}, `}
                      {viewDialog.customer.address.state && `${viewDialog.customer.address.state}, `}
                      {viewDialog.customer.address.country && viewDialog.customer.address.country}
                      {viewDialog.customer.address.postalCode && ` - ${viewDialog.customer.address.postalCode}`}
                    </p>
                    {viewDialog.customer.address.landmark && (
                      <p className="text-gray-500 dark:text-gray-400">
                        Landmark: {viewDialog.customer.address.landmark}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Government ID */}
              {viewDialog.customer.governmentId?.number && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Government ID</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-500 dark:text-gray-400">Type</label>
                      <p className="font-medium text-gray-900 dark:text-white">{viewDialog.customer.governmentId.type}</p>
                    </div>
                    <div>
                      <label className="text-gray-500 dark:text-gray-400">Number</label>
                      <p className="font-medium text-gray-900 dark:text-white">{viewDialog.customer.governmentId.number}</p>
                    </div>
                    {viewDialog.customer.governmentId.issuedDate && (
                      <div>
                        <label className="text-gray-500 dark:text-gray-400">Issued Date</label>
                        <p className="font-medium text-gray-900 dark:text-white">{formatDate(viewDialog.customer.governmentId.issuedDate)}</p>
                      </div>
                    )}
                    {viewDialog.customer.governmentId.expiryDate && (
                      <div>
                        <label className="text-gray-500 dark:text-gray-400">Expiry Date</label>
                        <p className="font-medium text-gray-900 dark:text-white">{formatDate(viewDialog.customer.governmentId.expiryDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Service Info */}
              {(viewDialog.customer.planType || viewDialog.customer.serviceStatus) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Service Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {viewDialog.customer.planType && (
                      <div>
                        <label className="text-gray-500 dark:text-gray-400">Plan Type</label>
                        <p className="font-medium text-gray-900 dark:text-white">{viewDialog.customer.planType}</p>
                      </div>
                    )}
                    {viewDialog.customer.billingType && (
                      <div>
                        <label className="text-gray-500 dark:text-gray-400">Billing Type</label>
                        <p className="font-medium text-gray-900 dark:text-white">{viewDialog.customer.billingType}</p>
                      </div>
                    )}
                    {viewDialog.customer.serviceStatus && (
                      <div>
                        <label className="text-gray-500 dark:text-gray-400">Service Status</label>
                        <p className="font-medium text-gray-900 dark:text-white">{viewDialog.customer.serviceStatus}</p>
                      </div>
                    )}
                    {viewDialog.customer.activationDate && (
                      <div>
                        <label className="text-gray-500 dark:text-gray-400">Activation Date</label>
                        <p className="font-medium text-gray-900 dark:text-white">{formatDate(viewDialog.customer.activationDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <button
            onClick={() => setViewDialog({ open: false, customer: null })}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CustomerList;
