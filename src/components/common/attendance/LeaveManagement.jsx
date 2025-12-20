import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  X
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import { useGetProfileQuery } from '../../../features/auth/authApi';

export default function LeaveManagement() {
  const { data: profileData } = useGetProfileQuery();
  const currentUserRole = profileData?.data?.role;
  
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewAction, setReviewAction] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  const [filters, setFilters] = useState({
    status: '',
    userId: ''
  });

  useEffect(() => {
    fetchLeaves();
    fetchEmployees();
    fetchPendingCount();
  }, [filters, currentUserRole]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/leave/all`, {
        params: filters,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let fetchedLeaves = response.data.leaves || [];
      
      console.log('Fetched Leaves:', fetchedLeaves.length);
      console.log('Current User Role:', currentUserRole);
      
      // If current user is TL, filter out ALL TL leaves (only show Agent and QA leaves)
      if (currentUserRole === 'TL') {
        const beforeFilter = fetchedLeaves.length;
        fetchedLeaves = fetchedLeaves.filter(leave => {
          const leaveUserRole = leave.userId?.role;
          console.log('Leave from:', leave.userId?.name, 'Role:', leaveUserRole);
          return leaveUserRole !== 'TL';
        });
        console.log(`TL View - Filtered ${beforeFilter} leaves to ${fetchedLeaves.length} (removed TL leaves)`);
      }
      
      setLeaves(fetchedLeaves);
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/user/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data.data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/leave/pending-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingCount(response.data.count || 0);
    } catch (err) {
      console.error('Error fetching pending count:', err);
    }
  };

  const handleReview = (leave, action) => {
    // Prevent TL from approving any TL's leave (their own or other TLs)
    if (currentUserRole === 'TL' && leave.userId?.role === 'TL') {
      setError('TL cannot approve/reject TL leaves. Only Admin can approve TL leaves.');
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    setSelectedLeave(leave);
    setReviewAction(action);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/v1/leave/review/${selectedLeave._id}`,
        {
          status: reviewAction,
          reviewComment
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`Leave ${reviewAction.toLowerCase()} successfully`);
      setShowReviewModal(false);
      fetchLeaves();
      fetchPendingCount();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error reviewing leave');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle size={18} className="text-green-600" />;
      case 'Rejected':
        return <XCircle size={18} className="text-red-600" />;
      case 'Pending':
        return <AlertCircle size={18} className="text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Check if buttons should be disabled - TL cannot approve TL leaves
  const shouldDisableButtons = (leave) => {
    const isCurrentUserTL = currentUserRole === 'TL';
    const isLeaveFromTL = leave.userId?.role === 'TL';
    const shouldDisable = isCurrentUserTL && isLeaveFromTL;
    
    console.log('Button Disable Check:', { 
      leaveId: leave._id,
      currentUserRole: currentUserRole, 
      leaveUserRole: leave.userId?.role,
      leaveUserName: leave.userId?.name,
      isCurrentUserTL, 
      isLeaveFromTL,
      shouldDisable
    });
    
    return shouldDisable;
  };

  return (
    <div className="p-6 min-h-screen dark:bg-gray-950">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Leave Management
          </h1>
          {pendingCount > 0 && (
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
              {pendingCount} pending approval{pendingCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X size={18} /></button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}><X size={18} /></button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Employee
            </label>
            <select
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.employee_id})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', userId: '' })}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Leaves Table */}
      {loading || !currentUserRole ? (
        <div className="text-center py-8">Loading...</div>
      ) : leaves.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No leave applications found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {leave.userId?.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {leave.userId?.employee_id} • {leave.userId?.role}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {leave.leaveType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {leave.reason}
                      </div>
                      {leave.status !== 'Pending' && leave.reviewComment && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
                          Review: {leave.reviewComment}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(leave.status)}
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                          {leave.status}
                        </span>
                      </div>
                      {leave.status !== 'Pending' && leave.reviewedBy && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          by {leave.reviewedBy.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {leave.status === 'Pending' ? (
                        shouldDisableButtons(leave) ? (
                          <div className="flex justify-end gap-2">
                            <button
                              disabled
                              className="px-3 py-1 bg-gray-400 text-white text-xs rounded cursor-not-allowed flex items-center gap-1 opacity-50"
                              title="Only Admin can approve TL leaves"
                            >
                              <CheckCircle size={14} />
                              Approve
                            </button>
                            <button
                              disabled
                              className="px-3 py-1 bg-gray-400 text-white text-xs rounded cursor-not-allowed flex items-center gap-1 opacity-50"
                              title="Only Admin can reject TL leaves"
                            >
                              <XCircle size={14} />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleReview(leave, 'Approved')}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center gap-1"
                              title="Approve"
                            >
                              <CheckCircle size={14} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReview(leave, 'Rejected')}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 flex items-center gap-1"
                              title="Reject"
                            >
                              <XCircle size={14} />
                              Reject
                            </button>
                          </div>
                        )
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                {reviewAction} Leave Application
              </h2>

              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="text-sm"><strong>Employee:</strong> {selectedLeave?.userId?.name}</p>
                <p className="text-sm"><strong>Duration:</strong> {selectedLeave?.totalDays} days</p>
                <p className="text-sm"><strong>Type:</strong> {selectedLeave?.leaveType}</p>
              </div>

              <form onSubmit={submitReview}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Comment {reviewAction === 'Rejected' && '*'}
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    required={reviewAction === 'Rejected'}
                    rows="4"
                    placeholder={`Enter ${reviewAction === 'Rejected' ? 'reason for rejection' : 'any comments'}`}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className={`flex-1 px-6 py-2 text-white rounded-lg ${reviewAction === 'Approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    Confirm {reviewAction}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
